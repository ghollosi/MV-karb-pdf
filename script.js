const RecordManager = {
    records: JSON.parse(localStorage.getItem('records')) || [],
    isCalculated: false,

    addRecord: function () {
        if (!validateForm()) return;

        const workName = document.getElementById('workName').value;
        const workDescription = document.getElementById('workDescription').value;
        const originalMaterialCost = parseFloat(document.getElementById('materialCost').value); // Eredeti nettó anyagköltség
        const materialProcurementFee = parseFloat(document.getElementById('materialProcurementFee').value); // Anyagbeszerzési díj
        const workHours = parseFloat(document.getElementById('workHours').value);
        const netHourlyRate = parseFloat(document.getElementById('hourlyRate').value);
        const notes = document.getElementById('notes').value;
        const vatRate = parseFloat(document.getElementById('vatRate').value) / 100 || 0.21;

        if (workName && workDescription && !isNaN(originalMaterialCost) && !isNaN(materialProcurementFee) && !isNaN(workHours) && !isNaN(netHourlyRate) && notes) {
            const adjustedNetMaterialCost = originalMaterialCost * (1 + materialProcurementFee / 100); // Nettó anyagköltség + beszerzési díj
            const materialVat = adjustedNetMaterialCost * vatRate;
            const grossMaterialCost = adjustedNetMaterialCost + materialVat;
            const netLaborCost = workHours * netHourlyRate;
            const laborVat = netLaborCost * vatRate;
            const grossLaborCost = netLaborCost + laborVat;
            const netTotal = adjustedNetMaterialCost + netLaborCost;
            const totalVat = materialVat + laborVat;
            const grossTotal = netTotal + totalVat;

            this.records.push({ 
                workName, 
                workDescription, 
                originalMaterialCost, // Eredeti nettó anyagköltség tárolása
                materialProcurementFee, // Anyagbeszerzési díj tárolása
                netMaterialCost: adjustedNetMaterialCost, // Számított nettó anyagköltség
                materialVat,
                grossMaterialCost,
                workHours, 
                netHourlyRate, 
                netLaborCost,
                laborVat,
                grossLaborCost,
                notes,
                netTotal,
                totalVat,
                grossTotal,
                vatRate: vatRate * 100
            });
            localStorage.setItem('records', JSON.stringify(this.records));
            this.updateTable();
            document.getElementById('maintenanceForm').reset();
            this.hideExportSection();
        } else {
            const lang = document.getElementById('languageSelect').value;
            const messages = {
                hu: "Kérjük, töltse ki az összes mezőt helyesen!",
                en: "Please fill in all fields correctly!",
                es: "¡Por favor, complete todos los campos correctamente!"
            };
            alert(messages[lang]);
        }
    },

    deleteRecord: function (index) {
        this.records.splice(index, 1);
        localStorage.setItem('records', JSON.stringify(this.records));
        this.updateTable();
        this.hideExportSection();
    },

    editRecord: function (index) {
        const record = this.records[index];
        document.getElementById('workName').value = record.workName;
        document.getElementById('workDescription').value = record.workDescription;
        document.getElementById('materialCost').value = record.originalMaterialCost; // Eredeti nettó anyagköltség visszaállítása
        document.getElementById('materialProcurementFee').value = record.materialProcurementFee || 15;
        document.getElementById('workHours').value = record.workHours;
        document.getElementById('hourlyRate').value = record.netHourlyRate;
        document.getElementById('notes').value = record.notes;

        this.records.splice(index, 1);
        localStorage.setItem('records', JSON.stringify(this.records));
        this.updateTable();

        const addButton = document.querySelector('#maintenanceForm button');
        addButton.textContent = "Módosítás mentése";
        addButton.onclick = () => {
            this.addRecord();
            addButton.textContent = "Új rekord hozzáadása";
            addButton.onclick = () => this.addRecord();
        };

        this.hideExportSection();
    },

    updateTable: function () {
        const tableBody = document.querySelector('#summaryTable tbody');
        tableBody.innerHTML = '';
        const vatRate = parseFloat(document.getElementById('vatRate').value) / 100 || 0.21;

        this.records.forEach((record, index) => {
            record.materialVat = record.netMaterialCost * vatRate;
            record.grossMaterialCost = record.netMaterialCost + record.materialVat;
            record.laborVat = record.netLaborCost * vatRate;
            record.grossLaborCost = record.netLaborCost + record.laborVat;
            record.totalVat = record.materialVat + record.laborVat;
            record.grossTotal = record.netTotal + record.totalVat;
            record.vatRate = vatRate * 100;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.workName}</td>
                <td>${record.workDescription}</td>
                <td>${record.netMaterialCost.toFixed(2)}</td>
                <td>${record.materialVat.toFixed(2)}</td>
                <td>${record.grossMaterialCost.toFixed(2)}</td>
                <td>${record.workHours.toFixed(2)}</td>
                <td>${record.netHourlyRate.toFixed(2)}</td>
                <td>${record.netLaborCost.toFixed(2)}</td>
                <td>${record.laborVat.toFixed(2)}</td>
                <td>${record.grossLaborCost.toFixed(2)}</td>
                <td>${record.notes}</td>
                <td>
                    <button onclick="RecordManager.deleteRecord(${index})">Törlés</button>
                    <button class="edit-button" onclick="RecordManager.editRecord(${index})">Szerkesztés</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        localStorage.setItem('records', JSON.stringify(this.records));
        this.updateTotals();
    },

    updateTotals: function () {
        const totalNetMaterialCost = document.getElementById('totalNetMaterialCost');
        const totalMaterialVat = document.getElementById('totalMaterialVat');
        const totalGrossMaterialCost = document.getElementById('totalGrossMaterialCost');
        const totalWorkHours = document.getElementById('totalWorkHours');
        const totalNetLaborCost = document.getElementById('totalNetLaborCost');
        const totalLaborVat = document.getElementById('totalLaborVat');
        const totalGrossLaborCost = document.getElementById('totalGrossLaborCost');
        const grandNetTotal = document.getElementById('grandNetTotal');
        const grandVatTotal = document.getElementById('grandVatTotal');
        const grandGrossTotal = document.getElementById('grandGrossTotal');

        let netMaterial = 0, materialVat = 0, grossMaterial = 0, hours = 0, netLabor = 0, laborVat = 0, grossLabor = 0;
        this.records.forEach(record => {
            netMaterial += record.netMaterialCost;
            materialVat += record.materialVat;
            grossMaterial += record.grossMaterialCost;
            hours += record.workHours;
            netLabor += record.netLaborCost;
            laborVat += record.laborVat;
            grossLabor += record.grossLaborCost;
        });

        totalNetMaterialCost.textContent = netMaterial.toFixed(2);
        totalMaterialVat.textContent = materialVat.toFixed(2);
        totalGrossMaterialCost.textContent = grossMaterial.toFixed(2);
        totalWorkHours.textContent = hours.toFixed(2);
        totalNetLaborCost.textContent = netLabor.toFixed(2);
        totalLaborVat.textContent = laborVat.toFixed(2);
        totalGrossLaborCost.textContent = grossLabor.toFixed(2);

        const netTravelCost = parseFloat(document.getElementById('netTravelCost').textContent) || 0;
        const travelVat = parseFloat(document.getElementById('travelVat').textContent) || 0;
        const grossTravelCost = parseFloat(document.getElementById('grossTravelCost').textContent) || 0;

        const grandNet = netMaterial + netLabor + netTravelCost;
        const grandVat = materialVat + laborVat + travelVat;
        const grandGross = grossMaterial + grossLabor + grossTravelCost;

        grandNetTotal.textContent = grandNet.toFixed(2);
        grandVatTotal.textContent = grandVat.toFixed(2);
        grandGrossTotal.textContent = grandGross.toFixed(2);

        document.getElementById('displayOffererName').textContent = document.getElementById('offererName').value;
        document.getElementById('displayClientName').textContent = document.getElementById('clientName').value;
        document.getElementById('displayClientAddress').textContent = document.getElementById('clientAddress').value;
        document.getElementById('displayClientPhone').textContent = document.getElementById('clientPhone').value;
        document.getElementById('displayClientEmail').textContent = document.getElementById('clientEmail').value;
        document.getElementById('displayValidityDays').textContent = document.getElementById('validityDays').value;
    },

    calculateTravelCost: function () {
        const totalWorkHours = parseFloat(document.getElementById('totalWorkHours').textContent) || 0;
        const netTravelRate = parseFloat(document.getElementById('travelRate').value) || 0;
        const distanceFromBase = parseFloat(document.getElementById('distanceFromBase').value) || 0;
        const vatRate = parseFloat(document.getElementById('vatRate').value) / 100 || 0.21;

        // 1. Munkaórák száma / 8, minimum 1, ha nagyobb mint 1, akkor felfelé kerekítve egész szám
        let multiplier = totalWorkHours / 8;
        if (multiplier < 8) {
            multiplier = 1;
        } else {
            multiplier = Math.ceil(totalWorkHours / 8);
        }

        // 2. Szorzó * Távolság a telephelytől
        const distanceFactor = multiplier * distanceFromBase;

        // 3. DistanceFactor * Kilométerdíj = Nettó kiszállási díj
        const netTravelCost = distanceFactor * netTravelRate;

        // 4. IVA kiszámítása a nettó kiszállási díj alapján
        const travelVat = netTravelCost * vatRate;
        const grossTravelCost = netTravelCost + travelVat;

        document.getElementById('netTravelCost').textContent = netTravelCost.toFixed(2);
        document.getElementById('travelVat').textContent = travelVat.toFixed(2);
        document.getElementById('grossTravelCost').textContent = grossTravelCost.toFixed(2);

        this.updateTotals();
        this.hideExportSection();
    },

    recalculateAll: function () {
        this.updateTable();
        this.calculateTravelCost();
        this.updateTotals();
        this.isCalculated = true;
        document.querySelector('.export-section').style.display = 'flex';

        const lang = document.getElementById('languageSelect').value;
        const messages = {
            hu: "Számolás megtörtént, most már exportálhat!",
            en: "Calculation completed, you can now export!",
            es: "¡Cálculo completado, ahora puede exportar!"
        };
        alert(messages[lang]);
    },

    hideExportSection: function () {
        this.isCalculated = false;
        document.querySelector('.export-section').style.display = 'none';
    },

    exportToPDF: function () {
        if (!this.isCalculated) {
            const lang = document.getElementById('languageSelect').value;
            const messages = {
                hu: "Előbb nyomja meg a 'Számolás' gombot!",
                en: "Please press the 'Calculate' button first!",
                es: "¡Por favor, presione el botón 'Calcular' primero!"
            };
            alert(messages[lang]);
            return;
        }

        const { jsPDF } = window.jspdf;
        const language = document.getElementById('languageSelect').value;
        const vatRate = parseFloat(document.getElementById('vatRate').value) || 21;

        if (this.records.length === 0) {
            const messages = {
                hu: "Nincs exportálható adat! Kérjük, adjon fel legalább egy rekordot.",
                en: "No data to export! Please add at least one record.",
                es: "¡No hay datos para exportar! Por favor, añada al menos un registro."
            };
            alert(messages[language]);
            return;
        }

        const translations = {
            hu: {
                title: "MOLINO VILLAS Karbantartás Kalkulátor (Nettó)",
                generated: "Generálva",
                offerer: "Ajánlatkészítő",
                clientName: "Ügyfél neve",
                clientAddress: "Ügyfél címe",
                clientPhone: "Ügyfél telefonszáma",
                clientEmail: "Ügyfél email címe",
                validity: "Ajánlat érvényessége",
                distance: "Távolság a telephelytől",
                days: "nap",
                km: "km",
                headers: [
                    "Munka megnevezése",
                    "Munka részletes leírása",
                    "Nettó anyagköltség (€)",
                    `IVA (${vatRate}%)`,
                    "Bruttó anyagköltség (€)",
                    "Munkaórák száma (h)",
                    "Nettó munkaóra költsége/fő (€/h)",
                    "Nettó munkadíj (€)",
                    `IVA (${vatRate}%)`,
                    "Bruttó munkadíj (€)",
                    "Megjegyzés"
                ],
                totals: [
                    "Kilométerdíj (€, nettó):",
                    "Kiszállási díj (€):",
                    "Összesen munkadíj (€):",
                    "Összesen anyagköltség (€):",
                    "Összesen (Anyag, Munkadíj, Kiszállás):"
                ],
                note: `A nettó összegek IVA nélkül értendők. Az IVA mértéke ${vatRate}%.`,
                filename: "molino_villas_karbantartas_osszesites_netto_hu.pdf"
            },
            en: {
                title: "MOLINO VILLAS Maintenance Calculator (Net)",
                generated: "Generated",
                offerer: "Offer prepared by",
                clientName: "Client name",
                clientAddress: "Client address",
                clientPhone: "Client phone number",
                clientEmail: "Client email address",
                validity: "Offer validity",
                distance: "Distance from base",
                days: "days",
                km: "km",
                headers: [
                    "Work description",
                    "Detailed work description",
                    "Net material cost (€)",
                    `VAT (${vatRate}%)`,
                    "Gross material cost (€)",
                    "Number of work hours (h)",
                    "Net hourly rate per person (€/h)",
                    "Net labor cost (€)",
                    `VAT (${vatRate}%)`,
                    "Gross labor cost (€)",
                    "Notes"
                ],
                totals: [
                    "Mileage rate (€, net):",
                    "Travel cost (€):",
                    "Total labor cost (€):",
                    "Total material cost (€):",
                    "Total (Materials, Labor, Travel):"
                ],
                note: `Net amounts are exclusive of VAT. The VAT rate is ${vatRate}%.`,
                filename: "molino_villas_maintenance_summary_net_en.pdf"
            },
            es: {
                title: "Calculadora de Mantenimiento MOLINO VILLAS (Neto)",
                generated: "Generado",
                offerer: "Preparado por",
                clientName: "Nombre del cliente",
                clientAddress: "Dirección del cliente",
                clientPhone: "Número de teléfono del cliente",
                clientEmail: "Correo electrónico del cliente",
                validity: "Validez de la oferta",
                distance: "Distancia desde la base",
                days: "días",
                km: "km",
                headers: [
                    "Descripción del trabajo",
                    "Descripción detallada del trabajo",
                    "Costo neto de materiales (€)",
                    `IVA (${vatRate}%)`,
                    "Costo bruto de materiales (€)",
                    "Número de horas de trabajo (h)",
                    "Tarifa horaria neta por persona (€/h)",
                    "Costo neto de mano de obra (€)",
                    `IVA (${vatRate}%)`,
                    "Costo bruto de mano de obra (€)",
                    "Notas"
                ],
                totals: [
                    "Tarifa por kilómetro (€, neto):",
                    "Costo de desplazamiento (€):",
                    "Costo total de mano de obra (€):",
                    "Costo total de materiales (€):",
                    "Total (Materiales, Mano de obra, Desplazamiento):"
                ],
                note: `Los importes netos no incluyen IVA. La tasa de IVA es del ${vatRate}%.`,
                filename: "molino_villas_resumen_mantenimiento_neto_es.pdf"
            }
        };

        const selectedLang = translations[language];
        const doc = new jsPDF({ orientation: 'portrait' });
        doc.setFont("Courier", "normal");

        const replaceHungarianChars = (text) => {
            if (language === 'hu') {
                return text
                    .replace(/ő/g, 'o')
                    .replace(/Ő/g, 'O')
                    .replace(/ű/g, 'u')
                    .replace(/Ű/g, 'U');
            }
            return text;
        };

        doc.setFontSize(15);
        doc.text(replaceHungarianChars(selectedLang.title), 10, 10);

        doc.setFontSize(8);
        const currentDate = new Date().toLocaleString();
        doc.text(replaceHungarianChars(`${selectedLang.generated}: ${currentDate}`), 10, 20);

        doc.setFontSize(9);
        let yPos = 30;
        const lineHeight = 5;
        doc.text(replaceHungarianChars(`${selectedLang.offerer}: ${document.getElementById('offererName').value}`), 10, yPos);
        yPos += lineHeight;
        doc.text(replaceHungarianChars(`${selectedLang.clientName}: ${document.getElementById('clientName').value}`), 10, yPos);
        yPos += lineHeight;
        doc.text(replaceHungarianChars(`${selectedLang.clientAddress}: ${document.getElementById('clientAddress').value}`), 10, yPos);
        yPos += lineHeight;
        doc.text(replaceHungarianChars(`${selectedLang.clientPhone}: ${document.getElementById('clientPhone').value}`), 10, yPos);
        yPos += lineHeight;
        doc.text(replaceHungarianChars(`${selectedLang.clientEmail}: ${document.getElementById('clientEmail').value}`), 10, yPos);
        yPos += lineHeight;
        doc.text(replaceHungarianChars(`${selectedLang.validity}: ${document.getElementById('validityDays').value} ${selectedLang.days}`), 10, yPos);
        yPos += lineHeight;
        doc.text(replaceHungarianChars(`${selectedLang.distance}: ${document.getElementById('distanceFromBase').value} ${selectedLang.km}`), 10, yPos);

        const tableStartY = yPos + 10;

        const data = this.records.map(record => [
            record.workName,
            record.workDescription,
            record.netMaterialCost.toFixed(2),
            record.materialVat.toFixed(2),
            record.grossMaterialCost.toFixed(2),
            record.workHours.toFixed(2),
            record.netHourlyRate.toFixed(2),
            record.netLaborCost.toFixed(2),
            record.laborVat.toFixed(2),
            record.grossLaborCost.toFixed(2),
            record.notes
        ]);

        const totalsForMainTable = ["", "", "", "", "", "", "", "", "", "", ""];
        totalsForMainTable[2] = document.getElementById('totalNetMaterialCost').textContent;
        totalsForMainTable[3] = document.getElementById('totalMaterialVat').textContent;
        totalsForMainTable[4] = document.getElementById('totalGrossMaterialCost').textContent;
        totalsForMainTable[5] = document.getElementById('totalWorkHours').textContent;
        totalsForMainTable[7] = document.getElementById('totalNetLaborCost').textContent;
        totalsForMainTable[8] = document.getElementById('totalLaborVat').textContent;
        totalsForMainTable[9] = document.getElementById('totalGrossLaborCost').textContent;

        doc.autoTable({
            head: [selectedLang.headers],
            body: data,
            foot: [totalsForMainTable],
            startY: tableStartY,
            theme: 'striped',
            styles: {
                font: "Courier",
                fontSize: 6,
                cellPadding: 2,
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
                lineWidth: 0.1,
                overflow: 'linebreak',
            },
            headStyles: {
                fillColor: [51, 51, 51],
                textColor: [255, 255, 255],
                font: "Courier",
                fontSize: 6,
            },
            footStyles: {
                fillColor: [200, 200, 200],
                textColor: [0, 0, 0],
                font: "Courier",
                fontSize: 6,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 18 },
                1: { cellWidth: 35 },
                2: { cellWidth: 13 },
                3: { cellWidth: 13 },
                4: { cellWidth: 13 },
                5: { cellWidth: 13 },
                6: { cellWidth: 13 },
                7: { cellWidth: 13 },
                8: { cellWidth: 13 },
                9: { cellWidth: 13 },
                10: { cellWidth: 25 },
            },
        });

        const totals = [
            [selectedLang.totals[0], document.getElementById('travelRate').value || "0", "", "", "", "", "", "", "", "", ""],
            [selectedLang.totals[1], "", "", "", "", "", "", document.getElementById('netTravelCost').textContent, document.getElementById('travelVat').textContent, document.getElementById('grossTravelCost').textContent, ""],
            [selectedLang.totals[2], "", "", "", "", "", "", document.getElementById('totalNetLaborCost').textContent, document.getElementById('totalLaborVat').textContent, document.getElementById('totalGrossLaborCost').textContent, ""],
            [selectedLang.totals[3], "", "", "", "", "", "", document.getElementById('totalNetMaterialCost').textContent, document.getElementById('totalMaterialVat').textContent, document.getElementById('totalGrossMaterialCost').textContent, ""],
            [selectedLang.totals[4], "", "", "", "", "", "", document.getElementById('grandNetTotal').textContent, document.getElementById('grandVatTotal').textContent, document.getElementById('grandGrossTotal').textContent, ""]
        ];

        doc.autoTable({
            body: totals,
            startY: doc.lastAutoTable.finalY + 10,
            theme: 'plain',
            styles: {
                font: "Courier",
                fontSize: 6,
                cellPadding: 2,
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
                lineWidth: 0.1,
                overflow: 'linebreak',
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 18 },
                1: { cellWidth: 35 },
                2: { cellWidth: 13 },
                3: { cellWidth: 13 },
                4: { cellWidth: 13 },
                5: { cellWidth: 13 },
                6: { cellWidth: 13 },
                7: { cellWidth: 13 },
                8: { cellWidth: 13 },
                9: { cellWidth: 13 },
                10: { cellWidth: 25 },
            },
        });

        doc.setFontSize(8);
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.text(selectedLang.note, 10, finalY);

        doc.save(selectedLang.filename);
        OfferManager.saveOffer();
    },

    exportToExcel: function () {
        if (!this.isCalculated) {
            const lang = document.getElementById('languageSelect').value;
            const messages = {
                hu: "Előbb nyomja meg a 'Számolás' gombot!",
                en: "Please press the 'Calculate' button first!",
                es: "¡Por favor, presione el botón 'Calcular' primero!"
            };
            alert(messages[lang]);
            return;
        }

        const wb = XLSX.utils.book_new();
        const wsData = [
            ["Ajánlatkészítő", document.getElementById('offererName').value],
            ["Ügyfél neve", document.getElementById('clientName').value],
            ["Ügyfél címe", document.getElementById('clientAddress').value],
            ["Ügyfél telefonszáma", document.getElementById('clientPhone').value],
            ["Ügyfél email címe", document.getElementById('clientEmail').value],
            ["Ajánlat érvényessége (nap)", document.getElementById('validityDays').value],
            ["Távolság a telephelytől (km)", document.getElementById('distanceFromBase').value],
            [],
            ["Munka megnevezése", "Munka részletes leírása", "Nettó anyagköltség (€)", "IVA", "Bruttó anyagköltség (€)", 
             "Munkaórák száma (h)", "Nettó munkaóra költsége/fő (€/h)", "Nettó munkadíj (€)", "IVA", "Bruttó munkadíj (€)", "Megjegyzés"]
        ];

        this.records.forEach(record => {
            wsData.push([
                record.workName,
                record.workDescription,
                record.netMaterialCost.toFixed(2),
                record.materialVat.toFixed(2),
                record.grossMaterialCost.toFixed(2),
                record.workHours.toFixed(2),
                record.netHourlyRate.toFixed(2),
                record.netLaborCost.toFixed(2),
                record.laborVat.toFixed(2),
                record.grossLaborCost.toFixed(2),
                record.notes
            ]);
        });

        wsData.push([]);
        wsData.push(["Összesen:", "", document.getElementById('totalNetMaterialCost').textContent, 
                     document.getElementById('totalMaterialVat').textContent, document.getElementById('totalGrossMaterialCost').textContent, 
                     document.getElementById('totalWorkHours').textContent, "", document.getElementById('totalNetLaborCost').textContent, 
                     document.getElementById('totalLaborVat').textContent, document.getElementById('totalGrossLaborCost').textContent, ""]);
        wsData.push(["Kiszállási díj (€):", "", "", "", "", "", "", document.getElementById('netTravelCost').textContent, 
                     document.getElementById('travelVat').textContent, document.getElementById('grossTravelCost').textContent, ""]);
        wsData.push(["Összesen (Anyag, Munkadíj, Kiszállás):", "", "", "", "", "", "", document.getElementById('grandNetTotal').textContent, 
                     document.getElementById('grandVatTotal').textContent, document.getElementById('grandGrossTotal').textContent, ""]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Karbantartás");
        XLSX.writeFile(wb, "molino_villas_karbantartas.xlsx");
    },
};

const PhotoManager = {
    uploadedPhotos: JSON.parse(localStorage.getItem('uploadedPhotos')) || [],
    handlePhotoUpload: function () {
        const files = document.getElementById('photoUpload').files;
        if (files.length > 20) {
            const lang = document.getElementById('languageSelect').value;
            const messages = {
                hu: "Maximum 20 fotó tölthető fel!",
                en: "Maximum 20 photos can be uploaded!",
                es: "¡Se pueden subir un máximo de 20 fotos!"
            };
            alert(messages[lang]);
            return;
        }

        this.uploadedPhotos = [];
        const photoList = document.getElementById('photoList');
        photoList.innerHTML = '';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = (e) => {
                this.uploadedPhotos.push(e.target.result);
                localStorage.setItem('uploadedPhotos', JSON.stringify(this.uploadedPhotos));
                this.displayPhotos();
            };

            reader.readAsDataURL(file);
        }
    },

    deletePhoto: function (index) {
        this.uploadedPhotos.splice(index, 1);
        localStorage.setItem('uploadedPhotos', JSON.stringify(this.uploadedPhotos));
        this.displayPhotos();
        RecordManager.hideExportSection();
    },

    displayPhotos: function () {
        const photoList = document.getElementById('photoList');
        photoList.innerHTML = '';
        this.uploadedPhotos.forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `
                <img src="${photo}" alt="Feltöltött fotó" style="max-width: 100px; max-height: 100px;">
                <button onclick="PhotoManager.deletePhoto(${index})">Törlés</button>
            `;
            photoList.appendChild(photoItem);
        });
    },
};

const OfferManager = {
    offers: JSON.parse(localStorage.getItem('savedOffers')) || [],
    saveOffer: function () {
        const offerData = {
            formData: {
                offererName: document.getElementById('offererName').value,
                clientName: document.getElementById('clientName').value,
                clientAddress: document.getElementById('clientAddress').value,
                clientPhone: document.getElementById('clientPhone').value,
                clientEmail: document.getElementById('clientEmail').value,
                validityDays: document.getElementById('validityDays').value,
                distanceFromBase: document.getElementById('distanceFromBase').value,
                vatRate: document.getElementById('vatRate').value
            },
            records: RecordManager.records,
            date: new Date().toLocaleString()
        };
        this.offers.push(offerData);
        localStorage.setItem('savedOffers', JSON.stringify(this.offers));
        this.updateOffersTable();
    },

    updateOffersTable: function () {
        const tableBody = document.querySelector('#offersTable tbody');
        tableBody.innerHTML = '';
        if (this.offers.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4">Nincsenek mentett ajánlatok.</td>';
            tableBody.appendChild(row);
        } else {
            this.offers.forEach((offer, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${offer.formData.offererName}</td>
                    <td>${offer.formData.clientName}</td>
                    <td>${offer.date}</td>
                    <td>
                        <button onclick="OfferManager.loadOffer(${index})">Betöltés</button>
                        <button onclick="OfferManager.deleteOffer(${index})">Törlés</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    },

    loadOffer: function (index) {
        const offer = this.offers[index];
        document.getElementById('offererName').value = offer.formData.offererName;
        document.getElementById('clientName').value = offer.formData.clientName;
        document.getElementById('clientAddress').value = offer.formData.clientAddress;
        document.getElementById('clientPhone').value = offer.formData.clientPhone;
        document.getElementById('clientEmail').value = offer.formData.clientEmail;
        document.getElementById('validityDays').value = offer.formData.validityDays;
        document.getElementById('distanceFromBase').value = offer.formData.distanceFromBase;
        document.getElementById('vatRate').value = offer.formData.vatRate;

        RecordManager.records = offer.records;
        localStorage.setItem('records', JSON.stringify(RecordManager.records));
        RecordManager.updateTable();
        RecordManager.calculateTravelCost();

        document.getElementById('offersModal').style.display = 'none';
        RecordManager.hideExportSection();
    },

    deleteOffer: function (index) {
        const lang = document.getElementById('languageSelect').value;
        const confirmMessages = {
            hu: `Biztosan törölni szeretné ezt az ajánlatot? (${this.offers[index].formData.clientName})`,
            en: `Are you sure you want to delete this offer? (${this.offers[index].formData.clientName})`,
            es: `¿Está seguro de que desea eliminar esta oferta? (${this.offers[index].formData.clientName})`
        };
        if (confirm(confirmMessages[lang])) {
            this.offers.splice(index, 1);
            localStorage.setItem('savedOffers', JSON.stringify(this.offers));
            this.updateOffersTable();
            RecordManager.hideExportSection();
        }
    }
};

function validateForm() {
    const lang = document.getElementById('languageSelect').value;
    const messages = {
        hu: {
            invalidEmail: "Érvénytelen email cím!",
            invalidPhone: "A telefonszám csak számokat tartalmazhat!",
            negativeValues: "Az anyagköltség és a munkaórák nem lehetnek negatívak!"
        },
        en: {
            invalidEmail: "Invalid email address!",
            invalidPhone: "The phone number can only contain digits!",
            negativeValues: "Material cost and work hours cannot be negative!"
        },
        es: {
            invalidEmail: "¡Dirección de correo electrónico inválida!",
            invalidPhone: "¡El número de teléfono solo puede contener dígitos!",
            negativeValues: "¡El costo de los materiales y las horas de trabajo no pueden ser negativos!"
        }
    };

    const email = document.getElementById('clientEmail').value;
    const phone = document.getElementById('clientPhone').value;
    const materialCost = parseFloat(document.getElementById('materialCost').value);
    const workHours = parseFloat(document.getElementById('workHours').value);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert(messages[lang].invalidEmail);
        return false;
    }

    if (!/^\d+$/.test(phone)) {
        alert(messages[lang].invalidPhone);
        return false;
    }

    if (materialCost < 0 || workHours < 0) {
        alert(messages[lang].negativeValues);
        return false;
    }

    return true;
}

function saveFormData() {
    const formData = {
        offererName: document.getElementById('offererName').value,
        clientName: document.getElementById('clientName').value,
        clientAddress: document.getElementById('clientAddress').value,
        clientPhone: document.getElementById('clientPhone').value,
        clientEmail: document.getElementById('clientEmail').value,
        validityDays: document.getElementById('validityDays').value,
        distanceFromBase: document.getElementById('distanceFromBase').value,
        vatRate: document.getElementById('vatRate').value
    };
    localStorage.setItem('formData', JSON.stringify(formData));
    const lang = document.getElementById('languageSelect').value;
    const messages = {
        hu: "Adatok mentve!",
        en: "Data saved!",
        es: "¡Datos guardados!"
    };
    alert(messages[lang]);
    RecordManager.hideExportSection();
}

function clearFormData() {
    localStorage.removeItem('formData');
    localStorage.removeItem('records');
    localStorage.removeItem('uploadedPhotos');

    document.getElementById('infoForm').reset();
    document.getElementById('maintenanceForm').reset();

    RecordManager.records = [];
    RecordManager.isCalculated = false;
    RecordManager.updateTable();
    PhotoManager.uploadedPhotos = [];
    PhotoManager.displayPhotos();

    document.querySelector('.export-section').style.display = 'none';

    const lang = document.getElementById('languageSelect').value;
    const messages = {
        hu: "Minden adat törölve!",
        en: "All data cleared!",
        es: "¡Todos los datos han sido borrados!"
    };
    alert(messages[lang]);
}

function loadFormData() {
    const savedData = JSON.parse(localStorage.getItem('formData'));
    if (savedData) {
        document.getElementById('offererName').value = savedData.offererName || '';
        document.getElementById('clientName').value = savedData.clientName || '';
        document.getElementById('clientAddress').value = savedData.clientAddress || '';
        document.getElementById('clientPhone').value = savedData.clientPhone || '';
        document.getElementById('clientEmail').value = savedData.clientEmail || '';
        document.getElementById('validityDays').value = savedData.validityDays || '';
        document.getElementById('distanceFromBase').value = savedData.distanceFromBase || '';
        document.getElementById('vatRate').value = savedData.vatRate || '21';
    }
}

// Súgó gomb és modal kezelése
document.getElementById('helpButton').onclick = function() {
    document.getElementById('helpModal').style.display = 'block';
};

document.getElementById('closeHelp').onclick = function() {
    document.getElementById('helpModal').style.display = 'none';
};

// Korábbi ajánlatok gomb és modal kezelése
document.getElementById('viewPreviousOffers').onclick = function() {
    OfferManager.updateOffersTable();
    document.getElementById('offersModal').style.display = 'block';
};

document.getElementById('closeOffers').onclick = function() {
    document.getElementById('offersModal').style.display = 'none';
};

// Modal bezárása, ha a felhasználó a modalon kívülre kattint
window.onclick = function(event) {
    const helpModal = document.getElementById('helpModal');
    const offersModal = document.getElementById('offersModal');
    if (event.target === helpModal) {
        helpModal.style.display = 'none';
    }
    if (event.target === offersModal) {
        offersModal.style.display = 'none';
    }
};

window.onload = function () {
    loadFormData();
    RecordManager.records = JSON.parse(localStorage.getItem('records')) || [];
    RecordManager.updateTable();
    PhotoManager.uploadedPhotos = JSON.parse(localStorage.getItem('uploadedPhotos')) || [];
    PhotoManager.displayPhotos();
    OfferManager.offers = JSON.parse(localStorage.getItem('savedOffers')) || [];
    OfferManager.updateOffersTable();
};
