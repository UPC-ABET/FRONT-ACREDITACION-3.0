import { jsPDF } from 'jspdf';

function getSvgSize(svg: SVGSVGElement): { width: number; height: number } {
	const viewBox = svg.viewBox.baseVal;
	const width = viewBox && viewBox.width ? viewBox.width : svg.clientWidth;
	const height = viewBox && viewBox.height ? viewBox.height : svg.clientHeight;
	return { width, height };
}

async function svgToCanvas(svg: SVGSVGElement, pixelRatio = 2): Promise<HTMLCanvasElement> {
	const { width, height } = getSvgSize(svg);

	const clone = svg.cloneNode(true) as SVGSVGElement;
	clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	clone.setAttribute('width', String(width));
	clone.setAttribute('height', String(height));

	const serialized = new XMLSerializer().serializeToString(clone);
	const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;

	const image = new Image();
	image.decoding = 'sync';
	await new Promise<void>((resolve, reject) => {
		image.onload = () => resolve();
		image.onerror = () => reject(new Error('chart.export.rasterizeFailed'));
		image.src = source;
	});

	const canvas = document.createElement('canvas');
	canvas.width = Math.max(1, Math.round(width * pixelRatio));
	canvas.height = Math.max(1, Math.round(height * pixelRatio));

	const context = canvas.getContext('2d');
	if (!context) throw new Error('chart.export.canvasUnavailable');
	context.fillStyle = '#ffffff';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.drawImage(image, 0, 0, canvas.width, canvas.height);

	return canvas;
}

function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

export async function exportSvgAsPng(svg: SVGSVGElement, filename: string): Promise<void> {
	const canvas = await svgToCanvas(svg, 2);
	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob((result) => resolve(result), 'image/png'),
	);
	if (blob) downloadBlob(blob, filename);
}

export async function exportSvgAsPdf(svg: SVGSVGElement, filename: string): Promise<void> {
	const canvas = await svgToCanvas(svg, 2);
	const pageWidth = (canvas.width * 72) / 96;
	const pageHeight = (canvas.height * 72) / 96;

	const pdf = new jsPDF({
		orientation: pageWidth >= pageHeight ? 'landscape' : 'portrait',
		unit: 'pt',
		format: [pageWidth, pageHeight],
	});

	const renderWidth = pdf.internal.pageSize.getWidth();
	const renderHeight = pdf.internal.pageSize.getHeight();
	pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, renderWidth, renderHeight);
	pdf.save(filename);
}
