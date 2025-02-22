const RecordManager = {
    records: JSON.parse(localStorage.getItem('records')) || [],
    addRecord: function () {
        if (!validateForm()) return;

        const workName = document.getElementById('workName').value;
        const materialCost = parseFloat(document.getElementById('materialCost').value);
        const workHours = parseFloat(document.getElementById('workHours').value);
        const hourlyRate = parseFloat(document.getElementById('hourlyRate').value);
        const notes = document.getElementById('notes').value;

        if (workName && !isNaN(materialCost) && !isNaN(workHours) && !isNaN(hourlyRate) && notes) {
            const laborCost = workHours * hourlyRate;
            const totalCost = materialCost + laborCost;
            this.records.push({ workName, materialCost, workHours, hourlyRate, laborCost, notes, totalCost });
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
    },
    updateTotals: function () {
        const totalMaterialCost = document.getElementById('totalMaterialCost');
        const totalWorkHours = document.getElementById('totalWorkHours');
        const totalLaborCost = document.getElementById('totalLaborCost');
        const totalOverallCost = document.getElementById('totalOverallCost');

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

        document.getElementById('displayOffererName').textContent = document.getElementById('offererName').value;
        document.getElementById('displayClientName').textContent = document.getElementById('clientName').value;
        document.getElementById('displayClientAddress').textContent = document.getElementById('clientAddress').value;
        document.getElementById('displayClientPhone').textContent = document.getElementById('clientPhone').value;
        document.getElementById('displayClientEmail').textContent = document.getElementById('clientEmail').value;
        document.getElementById('displayValidityDays').textContent = document.getElementById('validityDays').value;
    },
    exportToPDF: function () {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('MOLINO VILLAS Karbantartás Kalkulátor', 10, 10);

        const currentDate = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Generálva: ${currentDate}`, 10, 20);

        doc.setFontSize(12);
        doc.text(`Ajánlatkészítő: ${document.getElementById('offererName').value}`, 10, 30);
        doc.text(`Ügyfél neve: ${document.getElementById('clientName').value}`, 10, 40);
        doc.text(`Ügyfél címe: ${document.getElementById('clientAddress').value}`, 10, 50);
        doc.text(`Ügyfél telefonszáma: ${document.getElementById('clientPhone').value}`, 10, 60);
        doc.text(`Ügyfél email címe: ${document.getElementById('clientEmail').value}`, 10, 70);
        doc.text(`Ajánlat érvényessége: ${document.getElementById('validityDays').value} nap`, 10, 80);

        const headers = [
            "Munka megnevezése",
            "Anyagköltség (€)",
            "Munkaórák száma (h)",
            "Munkaóra költsége (€/h)",
            "Munkadíj (€)",
            "Megjegyzés",
            "Összesen (€)"
        ];
        const data = this.records.map(record => [
            record.workName,
            record.materialCost.toFixed(2),
            record.workHours.toFixed(2),
            record.hourlyRate.toFixed(2),
            record.laborCost.toFixed(2),
            record.notes,
            record.totalCost.toFixed(2)
        ]);

        doc.autoTable({
            head: [headers],
            body: data,
            startY: 90,
            theme: 'striped',
            styles: {
                fontSize: 10,
                cellPadding: 2,
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
            },
            headStyles: {
                fillColor: [51, 51, 51],
                textColor: [255, 255, 255],
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 'auto' },
                3: { cellWidth: 'auto' },
                4: { cellWidth: 'auto' },
                5: { cellWidth: 'auto' },
                6: { cellWidth: 'auto' },
            },
            margin: { top: 90 },
        });

        const totals = [
            "Összesen:",
            document.getElementById('totalMaterialCost').textContent,
            document.getElementById('totalWorkHours').textContent,
            "",
            document.getElementById('totalLaborCost').textContent,
            "",
            document.getElementById('totalOverallCost').textContent
        ];
        doc.autoTable({
            body: [totals],
            startY: doc.lastAutoTable.finalY + 10,
            theme: 'plain',
            styles: {
                fontSize: 10,
                cellPadding: 2,
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
            },
            columnStyles: {
                0: { fontStyle: 'bold' },
            },
        });

        doc.save('molino_villas_karbantartas_osszesites.pdf');
    },
    exportToExcel: function () {
        const workbook = XLSX.utils.book_new();

        const infoData = [
            ["Ajánlatkészítő neve:", document.getElementById('offererName').value],
            ["Ügyfél neve:", document.getElementById('clientName').value],
            ["Ügyfél címe:", document.getElementById('clientAddress').value],
            ["Ügyfél telefons
