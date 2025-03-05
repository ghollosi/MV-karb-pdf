const RecordManager = {
    records: JSON.parse(localStorage.getItem('records')) || [],
    addRecord: function () {
        if (!validateForm()) return;

        const workName = document.getElementById('workName').value;
        const workDescription = document.getElementById('workDescription').value;
        const materialCost = parseFloat(document.getElementById('materialCost').value);
        const materialProcurementFee = parseFloat(document.getElementById('materialProcurementFee').value);
        const workHours = parseFloat(document.getElementById('workHours').value);
        const hourlyRate = parseFloat(document.getElementById('hourlyRate').value);
        const notes = document.getElementById('notes').value;

        if (workName && workDescription && !isNaN(materialCost) && !isNaN(materialProcurementFee) && !isNaN(workHours) && !isNaN(hourlyRate) && notes) {
            const adjustedMaterialCost = materialCost * (1 + materialProcurementFee / 100);
            const laborCost = workHours * hourlyRate;
            const totalCost = adjustedMaterialCost + laborCost;
            this.records.push({ 
                workName, 
                workDescription, 
                materialCost: adjustedMaterialCost,
                rawMaterialCost: materialCost,
                materialProcurementFee,
                workHours, 
                hourlyRate, 
                laborCost, 
                notes, 
                totalCost 
            });
            localStorage.setItem('records', JSON.stringify(this.records));
            this.updateTable();
            document.getElementById('maintenanceForm').reset();
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
    },
    updateTable: function () {
        const tableBody = document.querySelector('#summaryTable tbody');
        tableBody.innerHTML = '';
        this.records.forEach((record, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.workName}</td>
                <td>${record.workDescription}</td>
                <td>${record.materialCost.toFixed(2)}</td>
                <td>${record.workHours.toFixed(2)}</td>
                <td>${record.hourlyRate.toFixed(2)}</td>
                <td>${record.laborCost.toFixed(2)}</td>
                <td>${record.notes}</td>
                <td>${record.totalCost.toFixed(2)}</td>
                <td><button onclick="RecordManager.deleteRecord(${index})">Törlés</button></td>
            `;
            tableBody.appendChild(row);
        });
        this.updateTotals();
        this.calculateTravelCost();
    },
    updateTotals: function () {
        const totalMaterialCost = document.getElementById('totalMaterialCost');
        const totalWorkHours = document.getElementById('totalWorkHours');
        const totalLaborCost = document.getElementById('totalLaborCost');
        const totalOverallCost = document.getElementById('totalOverallCost');
        const grandTotal = document.getElementById('grandTotal');

        let totalMaterial = 0, totalHours = 0, totalLabor = 0, totalOverall = 0;
        this.records.forEach(record => {
            totalMaterial += record.materialCost;
            totalHours += record.workHours;
            totalLabor += record.laborCost;
            totalOverall += record.totalCost;
        });

        totalMaterialCost.textContent = totalMaterial.toFixed(2);
        totalWorkHours.textContent = totalHours.toFixed(2);
        totalLaborCost.textContent = totalLabor.toFixed(2);
        totalOverallCost.textContent = totalOverall.toFixed(2);

        const travelCost = parseFloat(document.getElementById('travelCost').textContent) || 0;
        const grandTotalValue = totalMaterial + totalLabor + travelCost;
        grandTotal.textContent = grandTotalValue.toFixed(2);

        document.getElementById('displayOffererName').textContent = document.getElementById('offererName').value;
        document.getElementById('displayClientName').textContent = document.getElementById('clientName').value;
        document.getElementById('displayClientAddress').textContent = document.getElementById('clientAddress').value;
        document.getElementById('displayClientPhone').textContent = document.getElementById('clientPhone').value;
        document.getElementById('displayClientEmail').textContent = document.getElementById('clientEmail').value;
        document.getElementById('displayValidityDays').textContent = document.getElementById('validityDays').value;
    },
    calculateTravelCost: function () {
        const totalWorkHours = parseFloat(document.getElementById('totalWorkHours').textContent) || 0;
        const travelRate = parseFloat(document.getElementById('travelRate').value) || 0;
        const distanceFromBase = parseFloat(document.getElementById('distanceFromBase').value) || 0;

        let multiplier = totalWorkHours;
        if (totalWorkHours < 8) {
            multiplier = 8;
        } else {
            multiplier = Math.ceil(totalWorkHours / 8) * 8;
        }

        const travelCost = totalWorkHours / multiplier * travelRate * distanceFromBase;
        document.getElementById('travelCost').textContent = travelCost.toFixed(2);

        this.updateTotals();
    },
    exportToPDF: function () {
        const { jsPDF } = window.jspdf;
        const language = document.getElementById('languageSelect').value;

        if (this.records.length === 0) {
            const messages = {
                hu: "Nincs exportálható adat! Kérjük, adjon fel legalább egy rekordot.",
                en: "No data to export! Please add at least one record.",
                es: "¡No hay datos para exportar! Por favor, añada al menos un registro."
            };
            alert(messages[language]);
            return;
        }

        // Nyelvspecifikus szövegek
        const translations = {
            hu: {
                title: "MOLINO VILLAS Karbantartás Kalkulátor (Bruttó)",
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
                    "Anyagköltség (€, bruttó)",
                    "Munkaórák száma (h)",
                    "Munkaóra költsége/ fő (€/h, bruttó)",
                    "Munkadíj (€, bruttó)",
                    "Megjegyzés",
                    "Összesen (€, bruttó)"
                ],
                totals: [
                    "Összesen:",
                    "Kilométerdíj (€, bruttó):",
                    "Kiszállási díj (€, bruttó):",
                    "Összesen (Anyag, Munkadíj, Kiszállás, bruttó):"
                ],
                note: "A feltüntetett összegek az ÁFA-t tartalmazzák.",
                filename: "molino_villas_karbantartas_osszesites_brutto_hu.pdf"
            },
            en: {
                title: "MOLINO VILLAS Maintenance Calculator (Gross)",
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
                    "Material cost (€, gross)",
                    "Number of work hours (h)",
                    "Hourly rate per person (€/h, gross)",
                    "Labor cost (€, gross)",
                    "Notes",
                    "Total (€, gross)"
                ],
                totals: [
                    "Total:",
                    "Mileage rate (€, gross):",
                    "Travel cost (€, gross):",
                    "Total (Materials, Labor, Travel, gross):"
                ],
                note: "The amounts shown include VAT.",
                filename: "molino_villas_maintenance_summary_gross_en.pdf"
            },
            es: {
                title: "Calculadora de Mantenimiento MOLINO VILLAS (Bruto)",
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
                    "Costo de materiales (€, bruto)",
                    "Número de horas de trabajo (h)",
                    "Tarifa horaria por persona (€/h, bruto)",
                    "Costo de mano de obra (€, bruto)",
                    "Notas",
                    "Total (€, bruto)"
                ],
                totals: [
                    "Total:",
                    "Tarifa por kilómetro (€, bruto):",
                    "Costo de desplazamiento (€, bruto):",
                    "Total (Materiales, Mano de obra, Desplazamiento, bruto):"
                ],
                note: "Los importes indicados incluyen el IVA.",
                filename: "molino_villas_resumen_mantenimiento_bruto_es.pdf"
            }
        };

        const selectedLang = translations[language];
        const doc = new jsPDF({ orientation: 'portrait' });
        doc.setFont("Courier", "normal");

        // Függvény az ékezetes betűk cseréjére (csak magyar nyelvnél)
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

        // Cím
        doc.setFontSize(15);
        doc.text(replaceHungarianChars(selectedLang.title), 10, 10);

        // Generálási dátum
        doc.setFontSize(8);
        const currentDate = new Date().toLocaleString();
        doc.text(replaceHungarianChars(`${selectedLang.generated}: ${currentDate}`), 10, 20);

        // Egyszer megadandó adatok
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
            record.materialCost.toFixed(2),
            record.workHours.toFixed(2),
            record.hourlyRate.toFixed(2),
            record.laborCost.toFixed(2),
            record.notes,
            record.totalCost.toFixed(2)
        ]);

        doc.autoTable({
            head: [selectedLang.headers],
            body: data,
            startY: tableStartY,
            theme: 'striped',
            styles: {
                font: "Courier",
                fontSize: 7,
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
                fontSize: 7,
            },
            columnStyles: {
                0: { cellWidth: 23 },
                1: { cellWidth: 42 },
                2: { cellWidth: 18 },
                3: { cellWidth: 18 },
                4: { cellWidth: 18 },
                5: { cellWidth: 18 },
                6: { cellWidth: 33 },
                7: { cellWidth: 20 },
            },
        });

        const totals = [
            [selectedLang.totals[0], "", document.getElementById('totalMaterialCost').textContent, document.getElementById('totalWorkHours').textContent, "", document.getElementById('totalLaborCost').textContent, "", document.getElementById('totalOverallCost').textContent],
            [selectedLang.totals[1], document.getElementById('travelRate').value || "0", "", "", "", "", "", ""],
            [selectedLang.totals[2], "", "", "", "", "", "", document.getElementById('travelCost').textContent],
            [selectedLang.totals[3], "", "", "", "", "", "", document.getElementById('grandTotal').textContent]
        ];

        doc.autoTable({
            body: totals,
            startY: doc.lastAutoTable.finalY + 10,
            theme: 'plain',
            styles: {
                font: "Courier",
                fontSize: 7,
                cellPadding: 2,
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
                lineWidth: 0.1,
                overflow: 'linebreak',
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 23 },
                1: { cellWidth: 42 },
                2: { cellWidth: 18 },
                3: { cellWidth: 18 },
                4: { cellWidth: 18 },
                5: { cellWidth: 18 },
                6: { cellWidth: 33 },
                7: { cellWidth: 20 },
            },
        });

        // Megjegyzés a PDF alján
        doc.setFontSize(8);
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.text(selectedLang.note, 10, finalY);

        doc.save(selectedLang.filename);
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
    };
    localStorage.setItem('formData', JSON.stringify(formData));
    const lang = document.getElementById('languageSelect').value;
    const messages = {
        hu: "Adatok mentve!",
        en: "Data saved!",
        es: "¡Datos guardados!"
    };
    alert(messages[lang]);
}

function clearFormData() {
    localStorage.removeItem('formData');
    localStorage.removeItem('records');
    localStorage.removeItem('uploadedPhotos');

    document.getElementById('infoForm').reset();
    document.getElementById('maintenanceForm').reset();

    RecordManager.records = [];
    RecordManager.updateTable();
    PhotoManager.uploadedPhotos = [];
    PhotoManager.displayPhotos();

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
    }
}

// Súgó gomb és modal kezelése
document.getElementById('helpButton').onclick = function() {
    document.getElementById('helpModal').style.display = 'block';
};

document.getElementById('closeHelp').onclick = function() {
    document.getElementById('helpModal').style.display = 'none';
};

// Modal bezárása, ha a felhasználó a modalon kívülre kattint
window.onclick = function(event) {
    const modal = document.getElementById('helpModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

window.onload = function () {
    loadFormData();
    RecordManager.records = JSON.parse(localStorage.getItem('records')) || [];
    RecordManager.updateTable();
    PhotoManager.uploadedPhotos = JSON.parse(localStorage.getItem('uploadedPhotos')) || [];
    PhotoManager.displayPhotos();
};
