'use client';
import { useEffect, useRef, useState } from 'react';

const FALLBACK = "https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg";

export function PdfThumbnail({ pdfUrl, alt, className }: { pdfUrl: string; alt: string; className?: string }) {
    const [src, setSrc] = useState<string>(FALLBACK);
    const rendered = useRef(false);

    useEffect(() => {
        if (rendered.current || !pdfUrl || pdfUrl === FALLBACK) return;
        rendered.current = true;

        (async () => {
            try {
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = 
                    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

                const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 1.5 });

                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                    canvasContext: canvas.getContext('2d')!,
                    viewport
                } as any).promise;

                setSrc(canvas.toDataURL('image/png'));
            } catch {
                // Keep the fallback if rendering fails
            }
        })();
    }, [pdfUrl]);

    return <img src={src} alt={alt} className={className} loading="lazy" />;
}