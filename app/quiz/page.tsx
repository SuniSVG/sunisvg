'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function RedirectContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = (params?.id as string) || searchParams.get('id');

    useEffect(() => {
        if (id && id !== 'undefined') {
            router.replace(`/exams/take/${id}`);
        } else {
            router.replace('/exams');
        }
    }, [id, router]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
}

export default function ExamTakeRedirect() {
    return (
        <Suspense>
            <RedirectContent />
        </Suspense>
    );
}