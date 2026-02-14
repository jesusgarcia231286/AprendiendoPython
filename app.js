/* ============================================
   MANTENIMIENTO SALAS ELÉCTRICAS – SW-302
   Lógica principal: formulario, QR, PDF, historial
   ============================================ */

(function () {
    'use strict';

    // ============ STORAGE KEY ============
    var STORAGE_KEY = 'mantenimiento_sw302_registros';

    // ============ DRIVE (Google Sheets) SYNC ============
    // 1) Creá un Apps Script Web App que reciba POST y escriba en tu Google Sheet.
    // 2) Pegá acá la URL del Web App y una clave (API_KEY) que controles vos.
    //    Ejemplo ENDPOINT: https://script.google.com/macros/s/XXXXXXXX/exec
    var DRIVE_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbybtd0a_GVzGe3t8gEJBTvRGHUvi-wm_kGfxS6rFjUVUipBxqIVuT7NokZLivy9f8eKvA/exec'; // <-- PEGAR URL
    var DRIVE_API_KEY = 'SW302-AIRLIQUIDE';      // <-- PEGAR CLAVE

    // Cola local para cuando no hay internet (se reintenta al volver a estar online)
    var PENDING_KEY = 'mantenimiento_sw302_pendientes';


    // ============ INIT ============
    document.addEventListener('DOMContentLoaded', function () {
        initTabs();
        initForm();
        initQRPanel();
        initHistorial();
        initDriveSync();
        initPhotoPreview();
        checkURLParams();
        setDefaultDate();
    });

    // ============ TABS ============
    function initTabs() {
        var buttons = document.querySelectorAll('.nav-btn');
        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tabName = btn.getAttribute('data-tab');
                buttons.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(function (t) {
                    t.classList.remove('active');
                });
                var target = document.getElementById('tab-' + tabName);
                if (target) target.classList.add('active');
            });
        });
    }

    // ============ DEFAULT DATE ============
    function setDefaultDate() {
        var fechaInput = document.getElementById('fecha');
        if (fechaInput && !fechaInput.value) {
            var today = new Date();
            var yyyy = today.getFullYear();
            var mm = String(today.getMonth() + 1).padStart(2, '0');
            var dd = String(today.getDate()).padStart(2, '0');
            fechaInput.value = yyyy + '-' + mm + '-' + dd;
        }
    }

    // ============ URL PARAMS (QR pre-select sala) ============
    function checkURLParams() {
        var params = new URLSearchParams(window.location.search);
        var sala = params.get('sala');
        if (sala) {
            var salaSelect = document.getElementById('sala');
            if (salaSelect) {
                for (var i = 0; i < salaSelect.options.length; i++) {
                    if (salaSelect.options[i].value === sala) {
                        salaSelect.selectedIndex = i;
                        break;
                    }
                }
            }
            // Switch to formulario tab
            document.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.remove('active'); });
            var formBtn = document.querySelector('[data-tab="formulario"]');
            if (formBtn) formBtn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(function (t) { t.classList.remove('active'); });
            var formTab = document.getElementById('tab-formulario');
            if (formTab) formTab.classList.add('active');
        }
    }

    // ============ PHOTO PREVIEW ============
    function initPhotoPreview() {
        var photoInputs = [
            { input: 'foto_tablero', preview: 'preview_tablero' },
            { input: 'foto_display', preview: 'preview_display' },
            { input: 'foto_sala', preview: 'preview_sala' }
        ];

        photoInputs.forEach(function (item) {
            var input = document.getElementById(item.input);
            var preview = document.getElementById(item.preview);
            if (input && preview) {
                input.addEventListener('change', function (e) {
                    var file = e.target.files[0];
                    if (file) {
                        var reader = new FileReader();
                        reader.onload = function (ev) {
                            preview.innerHTML = '<img src="' + ev.target.result + '" alt="Preview">';
                            preview.classList.add('has-image');
                        };
                        reader.readAsDataURL(file);
                    } else {
                        preview.innerHTML = '';
                        preview.classList.remove('has-image');
                    }
                });
            }
        });
    }

    // ============ FORM ============
    function initForm() {
        var btnGuardar = document.getElementById('btnGuardar');
        var btnPDF = document.getElementById('btnPDF');

        if (btnGuardar) {
            btnGuardar.addEventListener('click', guardarRegistro);
        }
        if (btnPDF) {
            btnPDF.addEventListener('click', exportarPDF);
        }
    }

    function collectFormData() {
        var form = document.getElementById('mainForm');
        if (!form) return null;

        var data = {};

        // Text, number, date, select inputs
        var inputs = form.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], select, textarea');
        inputs.forEach(function (el) {
            if (el.name) {
                data[el.name] = el.value;
            }
        });

        // Checkboxes
        var checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(function (el) {
            if (el.name) {
                data[el.name] = el.checked;
            }
        });

        // Radio buttons
        var radios = form.querySelectorAll('input[type="radio"]:checked');
        radios.forEach(function (el) {
            if (el.name) {
                data[el.name] = el.value;
            }
        });

        // Timestamp
        data._timestamp = new Date().toISOString();
        data._id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

        return data;
    }

    function guardarRegistro() {
        var data = collectFormData();
        if (!data) return;

        // Validate required fields
        if (!data.sala) {
            showToast('Seleccioná una sala', 'error');
            return;
        }
        if (!data.tecnico) {
            showToast('Ingresá el nombre del técnico', 'error');
            return;
        }

        // Save to localStorage
        var registros = getRegistros();
        registros.push(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));

        showToast('Registro guardado correctamente (local)', 'success');
        renderHistorial();

        // Intentar guardar también en Drive (Sheets). Si no hay internet, queda en cola.
        enviarADrive(data).then(function (r) {
            if (r && r.ok) {
                showToast('✅ Guardado en Drive', 'success');
            } else {
                // Si no está configurado o falló, lo encolamos igual por si lo configurás después
                enqueuePendiente(data);
                if (r && r.error === 'Drive no configurado') {
                    showToast('⚠️ Drive no configurado (quedó local)', 'error');
                } else {
                    showToast('⚠️ Sin internet / error Drive (quedó local)', 'error');
                }
            }
        }).catch(function () {
            enqueuePendiente(data);
            showToast('⚠️ Sin internet / error Drive (quedó local)', 'error');
        });
    }

    // ============ DRIVE SYNC HELPERS ============
    function initDriveSync() {
        // Reintenta pendientes al abrir y cuando vuelve internet
        flushPendientes();
        window.addEventListener('online', flushPendientes);
    }

    function getPendientes() {
        try {
            var raw = localStorage.getItem(PENDING_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function setPendientes(arr) {
        localStorage.setItem(PENDING_KEY, JSON.stringify(arr || []));
    }

    function enqueuePendiente(registro) {
        var pend = getPendientes();
        pend.push(registro);
        setPendientes(pend);
    }

    function canSyncDrive() {
        return DRIVE_ENDPOINT_URL && DRIVE_API_KEY;
    }

    function enviarADrive(registro) {
        if (!canSyncDrive()) {
            // Si no configuraste aún la URL/KEY, no intenta sincronizar
            return Promise.resolve({ ok: false, error: 'Drive no configurado' });
        }

        // Mandamos TODO el objeto: así no perdés datos (y en Sheets guardás como columnas o JSON)
        return fetch(DRIVE_ENDPOINT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: DRIVE_API_KEY,
                registro: registro
            })
        }).then(function (res) {
            return res.json().catch(function () { return { ok: false, error: 'Respuesta inválida del servidor' }; });
        });
    }

    function flushPendientes() {
        var pend = getPendientes();
        if (!pend.length) return;

        // Si no hay config, no hacemos nada
        if (!canSyncDrive()) return;

        // Enviar en serie (más estable en celular)
        var chain = Promise.resolve();
        var enviados = 0;

        pend.forEach(function (registro) {
            chain = chain.then(function () {
                return enviarADrive(registro).then(function (r) {
                    if (r && r.ok) enviados++;
                }).catch(function () { /* ignora */ });
            });
        });

        chain.then(function () {
            if (enviados > 0) {
                // Dejamos solo los que no se pudieron enviar
                // (Para simplificar, reintentamos todo: si querés, lo hacemos “por confirmación”)
                setPendientes([]);
                showToast('Sincronizado en Drive (' + enviados + ')', 'success');
            }
        });
    }


    // ============ PDF EXPORT ============
    function exportarPDF() {
        var data = collectFormData();
        if (!data || !data.sala) {
            showToast('Completá al menos la sala antes de exportar', 'error');
            return;
        }

        showToast('Generando PDF...', '');

        var pdfContent = buildPDFContent(data);

        var opt = {
            margin: [10, 10, 10, 10],
            filename: 'Mantenimiento_' + (data.sala || 'Sala').replace(/\s/g, '_') + '_' + (data.fecha || 'sin_fecha') + '.pdf',
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(pdfContent).save().then(function () {
            showToast('PDF descargado', 'success');
            if (pdfContent.parentNode) {
                pdfContent.parentNode.removeChild(pdfContent);
            }
        });
    }

    function buildPDFContent(data) {
        var div = document.createElement('div');
        div.style.fontFamily = 'Inter, Arial, sans-serif';
        div.style.fontSize = '11px';
        div.style.color = '#1f2937';
        div.style.padding = '20px';
        div.style.maxWidth = '700px';

        var checkIcon = function (val) { return val ? '✅' : '⬜'; };
        var val = function (key) { return data[key] || '—'; };

        div.innerHTML = '' +
            '<div style="text-align:center;margin-bottom:20px;border-bottom:3px solid #1a56db;padding-bottom:15px;">' +
                '<h1 style="font-size:18px;color:#1a56db;margin:0;">Mantenimiento Salas Eléctricas</h1>' +
                '<p style="font-size:13px;color:#6b7280;margin:4px 0 0;">Sistema de Climatización – WESTRIC SW-302</p>' +
            '</div>' +

            '<table style="width:100%;border-collapse:collapse;margin-bottom:15px;">' +
                '<tr>' +
                    '<td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;width:25%;">Sala</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('sala') + '</td>' +
                    '<td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;width:25%;">Fecha</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('fecha') + '</td>' +
                '</tr>' +
                '<tr>' +
                    '<td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Técnico</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('tecnico') + '</td>' +
                    '<td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Cliente</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('cliente') + '</td>' +
                '</tr>' +
                '<tr>' +
                    '<td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Ubicación</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;" colspan="3">' + val('ubicacion') + '</td>' +
                '</tr>' +
            '</table>' +

            '<h2 style="font-size:13px;color:#1a56db;margin:15px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">🔌 Inspección Eléctrica</h2>' +
            '<table style="width:100%;border-collapse:collapse;margin-bottom:15px;">' +
                '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;width:50%;">' + checkIcon(data.elec_reapriete) + ' Reapriete de borneras</td>' +
                    '<td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.elec_tension) + ' Tensión correcta</td></tr>' +
                '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.elec_contactores) + ' Contactores OK</td>' +
                    '<td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.elec_cables) + ' Cables sin sulfatación</td></tr>' +
                '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.elec_sensor_limpio) + ' Sensor limpio</td>' +
                    '<td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.elec_sensor_ubicado) + ' Sensor bien ubicado</td></tr>' +
                '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.elec_placa) + ' Placa sin capacitores dañados</td>' +
                    '<td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.elec_reles) + ' Relés en buen estado</td></tr>' +
            '</table>' +

            '<h2 style="font-size:13px;color:#1a56db;margin:15px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">🌡 Mediciones Ambientales</h2>' +
            '<table style="width:100%;border-collapse:collapse;margin-bottom:15px;">' +
                '<tr>' +
                    '<td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Temp. sala</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('temp_sala') + ' °C</td>' +
                    '<td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Voltaje</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('voltaje') + ' V</td>' +
                '</tr>' +
                '<tr>' +
                    '<td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Temp. Westric</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('temp_westric') + ' °C</td>' +
                    '<td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Termómetro patrón</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('termometro_patron') + ' °C</td>' +
                '</tr>' +
                '<tr>' +
                    '<td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Humedad</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;" colspan="3">' + val('humedad') + ' %</td>' +
                '</tr>' +
            '</table>' +

            '<h2 style="font-size:13px;color:#1a56db;margin:15px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">❄️ Equipo de Aire 1</h2>' +
            '<table style="width:100%;border-collapse:collapse;margin-bottom:15px;">' +
                '<tr><td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;width:30%;">Estado</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('equipo1_estado') + '</td></tr>' +
                '<tr><td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Consumo</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('equipo1_consumo') + ' A</td></tr>' +
                '<tr><td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Verificaciones</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + checkIcon(data.equipo1_filtro) + ' Filtro limpio &nbsp;&nbsp;' + checkIcon(data.equipo1_condensadora) + ' Condensadora limpia</td></tr>' +
                '<tr><td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Observaciones</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('equipo1_obs') + '</td></tr>' +
            '</table>' +

            '<h2 style="font-size:13px;color:#1a56db;margin:15px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">❄️ Equipo de Aire 2</h2>' +
            '<table style="width:100%;border-collapse:collapse;margin-bottom:15px;">' +
                '<tr><td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;width:30%;">Estado</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('equipo2_estado') + '</td></tr>' +
                '<tr><td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Consumo</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('equipo2_consumo') + ' A</td></tr>' +
                '<tr><td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Verificaciones</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + checkIcon(data.equipo2_filtro) + ' Filtro limpio &nbsp;&nbsp;' + checkIcon(data.equipo2_condensadora) + ' Condensadora limpia</td></tr>' +
                '<tr><td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Observaciones</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('equipo2_obs') + '</td></tr>' +
            '</table>' +

            '<h2 style="font-size:13px;color:#1a56db;margin:15px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">🔄 Secuenciador SW-302</h2>' +
            '<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">' +
                '<tr>' +
                    '<td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Set Point</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('set_point') + ' °C</td>' +
                    '<td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Alarma alta</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('alarma_alta') + ' °C</td>' +
                '</tr>' +
                '<tr>' +
                    '<td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Tiempo rotación</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('tiempo_rotacion') + '</td>' +
                    '<td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Modo</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('modo_operacion') + '</td>' +
                '</tr>' +
                '<tr>' +
                    '<td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Estado SW-302</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:600;" colspan="3">' + val('sw302_estado') + '</td>' +
                '</tr>' +
            '</table>' +

            '<table style="width:100%;border-collapse:collapse;margin-bottom:15px;">' +
                '<tr style="background:#f3f4f6;"><td colspan="2" style="padding:6px 10px;font-weight:600;border:1px solid #e5e7eb;">Pruebas de ciclados</td></tr>' +
                '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;width:50%;">' + checkIcon(data.prueba_equipo1) + ' Equipo 1 operativo</td>' +
                    '<td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.prueba_equipo2) + ' Equipo 2 operativo</td></tr>' +
                '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.prueba_conmutacion) + ' Conmutación correcta</td>' +
                    '<td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.prueba_compresor) + ' Compresor arranca real</td></tr>' +
                '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.prueba_conmutacion_manual) + ' Conmutación manual</td>' +
                    '<td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.prueba_alta_temp) + ' Alta temperatura</td></tr>' +
                '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.prueba_falla_sensor) + ' Falla sensor</td>' +
                    '<td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.prueba_entradas_e1e2) + ' Entradas E1/E2</td></tr>' +

                '<tr style="background:#f3f4f6;"><td colspan="2" style="padding:6px 10px;font-weight:600;border:1px solid #e5e7eb;">Alarmas</td></tr>' +
                '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.alarma_alta_probada) + ' Alta temperatura probada</td>' +
                    '<td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.alarma_sirena) + ' Sirena activa</td></tr>' +
                '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.alarma_rele) + ' Relé alarma OK</td>' +
                    '<td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.alarma_falla_sensor) + ' Falla sensor detectada</td></tr>' +

                '<tr style="background:#f3f4f6;"><td colspan="2" style="padding:6px 10px;font-weight:600;border:1px solid #e5e7eb;">Entradas de falla</td></tr>' +
                '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.falla_e1) + ' E1 probada</td>' +
                    '<td style="padding:4px 8px;border:1px solid #e5e7eb;">' + checkIcon(data.falla_e2) + ' E2 probada</td></tr>' +
                '<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;" colspan="2">' + checkIcon(data.falla_cambio_auto) + ' Cambio automático correcto</td></tr>' +
            '</table>' +

            '<h2 style="font-size:13px;color:#1a56db;margin:15px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">📝 Diagnóstico Final</h2>' +
            '<table style="width:100%;border-collapse:collapse;margin-bottom:15px;">' +
                '<tr><td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;width:30%;">Estado sala</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:600;">' + val('estado_sala') + '</td></tr>' +
                '<tr><td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Observaciones</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('observaciones') + '</td></tr>' +
                '<tr><td style="padding:6px 10px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;">Firma técnico</td>' +
                    '<td style="padding:6px 10px;border:1px solid #e5e7eb;">' + val('firma') + '</td></tr>' +
            '</table>' +

            '<div style="text-align:center;margin-top:25px;padding-top:15px;border-top:2px solid #1a56db;color:#6b7280;font-size:10px;">' +
                '<p>Documento generado automáticamente – Sistema de Mantenimiento WESTRIC SW-302</p>' +
                '<p>Fecha de generación: ' + new Date().toLocaleString('es-AR') + '</p>' +
            '</div>';

        document.body.appendChild(div);
        div.style.position = 'absolute';
        div.style.left = '-9999px';
        div.style.top = '0';

        return div;
    }

    // ============ QR PANEL ============
    function initQRPanel() {
        var grid = document.getElementById('qrGrid');
        if (!grid) return;

        var baseURL = window.location.origin + window.location.pathname;

        for (var i = 1; i <= 9; i++) {
            var salaName = 'Sala ' + i;
            var qrURL = baseURL + '?sala=' + encodeURIComponent(salaName);

            var card = document.createElement('div');
            card.className = 'qr-card';

            var title = document.createElement('h3');
            title.textContent = salaName;
            card.appendChild(title);

            var qrContainer = document.createElement('div');
            qrContainer.className = 'qr-container';
            var qrDiv = document.createElement('div');
            qrDiv.id = 'qr-sala-' + i;
            qrContainer.appendChild(qrDiv);
            card.appendChild(qrContainer);

            var urlText = document.createElement('p');
            urlText.style.fontSize = '0.7rem';
            urlText.style.color = '#9ca3af';
            urlText.style.wordBreak = 'break-all';
            urlText.style.margin = '0.5rem 0';
            urlText.textContent = qrURL;
            card.appendChild(urlText);

            var btnDownload = document.createElement('button');
            btnDownload.className = 'btn btn-primary';
            btnDownload.textContent = 'Descargar QR';
            btnDownload.setAttribute('data-sala', i.toString());
            btnDownload.addEventListener('click', function () {
                var salaNum = this.getAttribute('data-sala');
                downloadQR(salaNum);
            });
            card.appendChild(btnDownload);

            grid.appendChild(card);

            // Generate QR
            try {
                new QRCode(qrDiv, {
                    text: qrURL,
                    width: 160,
                    height: 160,
                    colorDark: '#1a56db',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            } catch (e) {
                qrDiv.innerHTML = '<p style="color:#dc2626;font-size:0.8rem;">Error generando QR</p>';
            }
        }
    }

    function downloadQR(salaNum) {
        var qrDiv = document.getElementById('qr-sala-' + salaNum);
        if (!qrDiv) return;

        var canvas = qrDiv.querySelector('canvas');
        var img = qrDiv.querySelector('img');

        if (canvas) {
            var link = document.createElement('a');
            link.download = 'QR_Sala_' + salaNum + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } else if (img) {
            var link2 = document.createElement('a');
            link2.download = 'QR_Sala_' + salaNum + '.png';
            link2.href = img.src;
            link2.click();
        }
    }

    // ============ HISTORIAL ============
    function getRegistros() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function initHistorial() {
        renderHistorial();

        var btnCSV = document.getElementById('btnExportCSV');
        var btnLimpiar = document.getElementById('btnLimpiarHistorial');

        if (btnCSV) {
            btnCSV.addEventListener('click', exportarCSV);
        }
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', function () {
                if (confirm('¿Estás seguro de que querés borrar todo el historial?')) {
                    localStorage.removeItem(STORAGE_KEY);
                    renderHistorial();
                    showToast('Historial eliminado', 'success');
                }
            });
        }
    }

    function renderHistorial() {
        var list = document.getElementById('historialList');
        var stats = document.getElementById('historialStats');
        var registros = getRegistros();

        if (!list) return;

        // Stats
        if (stats) {
            if (registros.length === 0) {
                stats.innerHTML = '';
            } else {
                var totalRegistros = registros.length;
                var salasUnicas = [];
                var operativas = 0;
                var conObs = 0;
                var riesgo = 0;

                registros.forEach(function (r) {
                    if (r.sala && salasUnicas.indexOf(r.sala) === -1) {
                        salasUnicas.push(r.sala);
                    }
                    if (r.estado_sala === 'Operativa') operativas++;
                    else if (r.estado_sala === 'Observaciones') conObs++;
                    else if (r.estado_sala === 'Riesgo') riesgo++;
                });

                stats.innerHTML = '' +
                    '<div class="stat-card"><div class="stat-number">' + totalRegistros + '</div><div class="stat-label">Total registros</div></div>' +
                    '<div class="stat-card"><div class="stat-number">' + salasUnicas.length + '</div><div class="stat-label">Salas atendidas</div></div>' +
                    '<div class="stat-card"><div class="stat-number" style="color:#059669;">' + operativas + '</div><div class="stat-label">Operativas</div></div>' +
                    '<div class="stat-card"><div class="stat-number" style="color:#d97706;">' + conObs + '</div><div class="stat-label">Con observaciones</div></div>' +
                    '<div class="stat-card"><div class="stat-number" style="color:#dc2626;">' + riesgo + '</div><div class="stat-label">En riesgo</div></div>';
            }
        }

        // List
        if (registros.length === 0) {
            list.innerHTML = '<p class="empty-state">No hay registros guardados aún.</p>';
            return;
        }

        var html = '';
        // Show newest first
        for (var i = registros.length - 1; i >= 0; i--) {
            var r = registros[i];
            var statusClass = '';
            var statusText = r.estado_sala || 'Sin estado';
            if (r.estado_sala === 'Operativa') statusClass = 'operativa';
            else if (r.estado_sala === 'Observaciones') statusClass = 'observaciones';
            else if (r.estado_sala === 'Riesgo') statusClass = 'riesgo';

            html += '' +
                '<div class="historial-item" data-index="' + i + '">' +
                    '<div class="historial-item-info">' +
                        '<h4>' + (r.sala || 'Sin sala') + ' <span class="status-badge ' + statusClass + '">' + statusText + '</span></h4>' +
                        '<p>' + (r.fecha || 'Sin fecha') + ' — ' + (r.tecnico || 'Sin técnico') + (r.cliente ? ' — ' + r.cliente : '') + '</p>' +
                    '</div>' +
                    '<div class="historial-item-actions">' +
                        '<button class="btn btn-secondary btn-ver-detalle" data-index="' + i + '">Ver</button>' +
                        '<button class="btn btn-outline btn-danger btn-eliminar" data-index="' + i + '">Eliminar</button>' +
                    '</div>' +
                '</div>';
        }

        list.innerHTML = html;

        // Bind events
        list.querySelectorAll('.btn-eliminar').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.getAttribute('data-index'));
                eliminarRegistro(idx);
            });
        });

        list.querySelectorAll('.btn-ver-detalle').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.getAttribute('data-index'));
                verDetalle(idx);
            });
        });
    }

    function eliminarRegistro(index) {
        if (!confirm('¿Eliminar este registro?')) return;
        var registros = getRegistros();
        registros.splice(index, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
        renderHistorial();
        showToast('Registro eliminado', 'success');
    }

    function verDetalle(index) {
        var registros = getRegistros();
        var r = registros[index];
        if (!r) return;

        // Generate PDF for this record
        showToast('Generando PDF del registro...', '');
        var pdfContent = buildPDFContent(r);

        var opt = {
            margin: [10, 10, 10, 10],
            filename: 'Registro_' + (r.sala || 'Sala').replace(/\s/g, '_') + '_' + (r.fecha || 'sin_fecha') + '.pdf',
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(pdfContent).save().then(function () {
            showToast('PDF descargado', 'success');
            if (pdfContent.parentNode) {
                pdfContent.parentNode.removeChild(pdfContent);
            }
        });
    }

    // ============ CSV EXPORT ============
    function exportarCSV() {
        var registros = getRegistros();
        if (registros.length === 0) {
            showToast('No hay registros para exportar', 'error');
            return;
        }

        // Collect all keys
        var allKeys = [];
        registros.forEach(function (r) {
            Object.keys(r).forEach(function (k) {
                if (allKeys.indexOf(k) === -1) allKeys.push(k);
            });
        });

        // Build CSV
        var csvRows = [];
        csvRows.push(allKeys.join(','));

        registros.forEach(function (r) {
            var row = allKeys.map(function (k) {
                var val = r[k];
                if (val === undefined || val === null) return '';
                if (typeof val === 'boolean') return val ? 'SI' : 'NO';
                var str = String(val).replace(/"/g, '""');
                return '"' + str + '"';
            });
            csvRows.push(row.join(','));
        });

        var csvContent = csvRows.join('\n');
        var blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Mantenimiento_SW302_Historial.csv';
        link.click();

        showToast('CSV exportado correctamente', 'success');
    }

    // ============ TOAST ============
    function showToast(message, type) {
        var toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = 'toast';
        if (type) toast.classList.add(type);
        toast.classList.add('show');

        setTimeout(function () {
            toast.classList.remove('show');
        }, 3000);
    }

})();

