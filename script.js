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
            alert('Kérjük, töltse ki az összes mezőt helyesen!');
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
        const doc = new jsPDF({ orientation: 'portrait' });
    
        doc.setFont("Courier", "normal");
    
        // Függvény az ékezetes betűk cseréjére
        const replaceHungarianChars = (text) => {
            return text
                .replace(/ő/g, 'o')
                .replace(/Ő/g, 'O')
                .replace(/ű/g, 'u')
                .replace(/Ű/g, 'U');
        };
    
        // Cím
        doc.setFontSize(15);
        doc.text(replaceHungarianChars('MOLINO VILLAS Karbantartás Kalkulátor'), 10, 10);
    
        // Generálási dátum
        doc.setFontSize(8);
        const currentDate = new Date().toLocaleString();
        doc.text(`Generálva: ${currentDate}`, 10, 20);
    
        // Egyszer megadandó adatok minimális sorközzel
        doc.setFontSize(9);
        let yPos = 30;
        const lineHeight = 5;
        doc.text(replaceHungarianChars(`Ajánlatkészítő: ${document.getElementById('offererName').value}`), 10, yPos);
        yPos += lineHeight;
        doc.text(replaceHungarianChars(`Ügyfél neve: ${document.getElementById('clientName').value}`), 10, yPos);
        yPos += lineHeight;
        doc.text(replaceHungarianChars(`Ügyfél címe: ${document.getElementById('clientAddress').value}`), 10, yPos);
        yPos += lineHeight;
        doc.text(replaceHungarianChars(`Ügyfél telefonszáma: ${document.getElementById('clientPhone').value}`), 10, yPos);
        yPos += lineHeight;
        doc.text(replaceHungarianChars(`Ügyfél email címe: ${document.getElementById('clientEmail').value}`), 10, yPos);
        yPos += lineHeight;
        doc.text(replaceHungarianChars(`Ajánlat érvényessége: ${document.getElementById('validityDays').value} nap`), 10, yPos);
        yPos += lineHeight;
        doc.text(replaceHungarianChars(`Távolság a telephelytől: ${document.getElementById('distanceFromBase').value} km`), 10, yPos);
    
        const tableStartY = yPos + 10;
    
        const headers = [
            "Munka megnevezése",
            "Munka részletes leírása",
            "Anyagköltség (€)",
            "Munkaórák száma (h)",
            "Munkaóra költsége/ fő (€/h)",
            "Munkadíj (€)",
            "Megjegyzés",
            "Összesen (€)"
        ].map(replaceHungarianChars);
    
        const data = this.records.map(record => [
            replaceHungarianChars(record.workName),
            replaceHungarianChars(record.workDescription),
            record.materialCost.toFixed(2),
            record.workHours.toFixed(2),
            record.hourlyRate.toFixed(2),
            record.laborCost.toFixed(2),
            replaceHungarianChars(record.notes),
            record.totalCost.toFixed(2)
        ]);
    
        doc.autoTable({
            head: [headers],
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
            ["Összesen:", "", document.getElementById('totalMaterialCost').textContent, document.getElementById('totalWorkHours').textContent, "", document.getElementById('totalLaborCost').textContent, "", document.getElementById('totalOverallCost').textContent],
            ["Kilométerdíj (€):", document.getElementById('travelRate').value || "0", "", "", "", "", "", ""],
            ["Kiszállási díj (€):", "", "", "", "", "", "", document.getElementById('travelCost').textContent],
            ["Összesen (Anyag, Munkadíj, Kiszállás):", "", "", "", "", "", "", document.getElementById('grandTotal').textContent]
        ].map(row => row.map(cell => typeof cell === 'string' ? replaceHungarianChars(cell) : cell));
    
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
    
        doc.save('molino_villas_karbantartas_osszesites.pdf');
    },
};

const PhotoManager = {
    uploadedPhotos: JSON.parse(localStorage.getItem('uploadedPhotos')) || [],
    handlePhotoUpload: function () {
        const files = document.getElementById('photoUpload').files;
        if (files.length > 20) {
            alert('Maximum 20 fotó tölthető fel!');
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
    const email = document.getElementById('clientEmail').value;
    const phone = document.getElementById('clientPhone').value;
    const materialCost = parseFloat(document.getElementById('materialCost').value);
    const workHours = parseFloat(document.getElementById('workHours').value);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Érvénytelen email cím!');
        return false;
    }

    if (!/^\d+$/.test(phone)) {
        alert('A telefonszám csak számokat tartalmazhat!');
        return false;
    }

    if (materialCost < 0 || workHours < 0) {
        alert('Az anyagköltség és a munkaórák nem lehetnek negatívak!');
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
    alert('Adatok mentve!');
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

    alert('Minden adat törölve!');
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
