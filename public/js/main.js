document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.jspdf !== 'undefined' && typeof JsBarcode !== 'undefined') {
        document.getElementById('generatePdfButton').addEventListener('click', generatePDF);

        document.getElementById('cns').addEventListener('input', function() {
            const cns = this.value;
            if (cns.length === 15) {
                JsBarcode("#barcode-preview", cns, {
                    format: "CODE128",
                    displayValue: true,
                    fontSize: 16,
                    margin: 10
                });
                document.getElementById('barcode-preview').style.display = 'block';
            } else {
                document.getElementById('barcode-preview').style.display = 'none';
            }
        });
    } else {
        alert('Erro: Bibliotecas necessárias não foram carregadas. Recarregue a página.');
    }
});

async function generatePDF() {
    const form = document.getElementById('beneficiaryForm');
    const loading = document.getElementById('loading');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    loading.style.display = 'block';
    document.getElementById('generatePdfButton').disabled = true;

    try {
        const nome = document.getElementById('nome').value;
        const dataNascimento = document.getElementById('dataNascimento').value;
        const sexo = document.getElementById('sexo').value;
        const cns = document.getElementById('cns').value;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const img = document.getElementById('rustImage');
        const imgData = await getImageBase64(img);

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const desiredWidth = 503;
        const desiredHeight = 187.5;
        const pdfUnitsWidth = desiredWidth * 0.3528;
        const pdfUnitsHeight = desiredHeight * 0.3528;
        const xOffset = 15;
        const yOffset = 68;

        doc.addImage(imgData, 'PNG', xOffset, yOffset, pdfUnitsWidth, pdfUnitsHeight);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Cartão Nacional de Saúde - CNS", pageWidth / 2, 21, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(`Sr. ${nome.toUpperCase()},`, 20, 33);

        const mensagem = [
            "Parabéns! Seus dados já constam no Sistema Único de Saúde - SUS.",
            "Informe seu número de CNS quando usar a rede do Sistema Único de Saúde – SUS.",
            "Recorte o Cartão abaixo e use-o normalmente. Ele vale em todo o território nacional."
        ];

        let yPosition = 38;
        mensagem.forEach(line => {
            doc.text(line, 20, yPosition);
            yPosition += 5;
        });

        doc.setFont("courier new", "bold");
        doc.setFontSize(9);
        doc.text(`${formatarNome(nome)}`, 120, 86);

        doc.setFont("courier new", "bold");
        doc.setFontSize(8);
        doc.text(`Data Nasc.: ${formatDate(dataNascimento)}`, 120, 94);
        doc.text(`Sexo: ${sexo}`, 165, 94);

        const formatarCNS = (cns) => {
            return cns.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, "$1  $2  $3  $4");
        };

        doc.setFont("courier new", "bold");
        doc.setFontSize(18);
        doc.text(formatarCNS(cns), 120, 101);

        const barcodeCanvas = document.createElement('canvas');
        JsBarcode(barcodeCanvas, cns, {
            format: "CODE128",
            displayValue: false,
            width: 2,
            height: 50,
            margin: 0
        });

        const barcodeData = barcodeCanvas.toDataURL('image/png');
        doc.addImage(barcodeData, 'PNG', 121, 103, 55, 8);

        doc.setFontSize(10);
        doc.setTextColor(200, 200, 200);
        doc.text(`Documento gerado em: ${new Date().toLocaleString()}`, 
                pageWidth - 20, pageHeight - 10, { align: 'right' });

        doc.save(`Beneficiario_${nome.replace(/\s/g, '_')}.pdf`);
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Ocorreu um erro ao gerar o PDF.');
    } finally {
        loading.style.display = 'none';
        document.getElementById('generatePdfButton').disabled = false;
    }
}

// Helper functions moved outside of generatePDF
function formatarNome(nomeCompleto) {
    nomeCompleto = nomeCompleto.trim();

    if (nomeCompleto.length <= 40) {
        return nomeCompleto.toUpperCase();
    }

    const partes = nomeCompleto.split(/\s+/);

    if (partes.length <= 2) {
        return nomeCompleto.toUpperCase().slice(0, 40);
    }

    const primeiroNome = partes[0];
    const ultimoNome = partes[partes.length - 1];
    const nomesDoMeio = partes.slice(1, -1).map(p => p[0] + ".");

    const nomeAbreviado = [primeiroNome, ...nomesDoMeio, ultimoNome].join(" ");
    return nomeAbreviado.toUpperCase().slice(0, 40);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function getImageBase64(img) {
    return new Promise((resolve, reject) => {
        if (img.complete && img.naturalWidth !== 0) {
            resolve(getCanvasImageData(img));
            return;
        }
        img.onload = () => {
            resolve(getCanvasImageData(img));
        };
        img.onerror = () => {
            reject(new Error('Falha ao carregar a imagem'));
        };
    });
}

function getCanvasImageData(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
}
