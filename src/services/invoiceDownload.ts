/**
 * invoiceDownload.ts
 *
 * Typed JavaScript bridge for the Android native InvoiceDownloadModule.
 *
 * Usage:
 *   import { downloadInvoice } from '../services/invoiceDownload';
 *
 *   const result = await downloadInvoice({
 *     url: `${API_BASE_URL}/orders/${dbId}/invoice`,
 *     authToken: token,
 *     orderId: order.orderId,
 *   });
 *
 *   if (result.success) {
 *     // Download is queued — Android handles the rest (progress & completion notifications)
 *     console.log('DownloadManager ID:', result.downloadId);
 *   } else {
 *     console.error(result.error);
 *   }
 */

import { NativeModules, Platform } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DownloadInvoiceParams {
    /** Full URL of the invoice PDF endpoint */
    url: string;
    /** Raw bearer token (without "Bearer " prefix) */
    authToken: string;
    /** Logical order ID used in the filename: Invoice_<orderId>.pdf */
    orderId: string;
}

export type DownloadInvoiceResult =
    | { success: true; downloadId: number }
    | { success: false; error: string };

// ─── Native module reference ───────────────────────────────────────────────────

const { InvoiceDownloadModule } = NativeModules;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Enqueue a PDF invoice download using Android's native DownloadManager.
 *
 * - Android 10+ : No runtime permission required.
 * - Android 9-  : WRITE_EXTERNAL_STORAGE must be granted before calling this.
 *                 The module does NOT request the permission itself; the caller
 *                 is responsible (see orders.tsx → handleDownloadInvoice).
 *
 * The function returns as soon as DownloadManager has accepted the request.
 * All progress notifications and the "Download complete" notification are
 * managed by the Android system — no polling or callbacks needed.
 *
 * @throws Never — errors are returned as { success: false, error } objects.
 */
export async function downloadInvoice(
    params: DownloadInvoiceParams
): Promise<DownloadInvoiceResult> {
    if (Platform.OS !== 'android') {
        return { success: false, error: 'InvoiceDownloadModule is Android-only.' };
    }

    if (!InvoiceDownloadModule) {
        return {
            success: false,
            error:
                'InvoiceDownloadModule is not linked. Rebuild the app after adding the native module.',
        };
    }

    try {
        const downloadId: number = await InvoiceDownloadModule.downloadInvoice(
            params.url,
            params.authToken,
            params.orderId
        );
        return { success: true, downloadId };
    } catch (err: any) {
        const error: string =
            err?.message ?? err?.toString() ?? 'Unknown download error';
        return { success: false, error };
    }
}
