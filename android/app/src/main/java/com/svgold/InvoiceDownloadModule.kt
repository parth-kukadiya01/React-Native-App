package com.svgold

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * InvoiceDownloadModule
 *
 * Hands a PDF download off to Android's native DownloadManager — exactly the same
 * system service used by Chrome, WhatsApp, and every other well-behaved Android app.
 *
 * What this gives you (for free, with zero extra code):
 *  • Progress notification in the system tray while downloading
 *  • "Download complete" notification when done
 *  • Tap-to-open: tapping the notification opens the PDF in the default viewer
 *  • File appears in Files, Downloads app, and Recent Downloads
 *  • Correct scoped-storage / permissions handling for API 21–35
 *
 * Android version matrix
 *  API < 29  (Android 9-)  : WRITE_EXTERNAL_STORAGE is required (declared in manifest,
 *                             requested at runtime if targetSdk < 29).
 *  API 29-32 (Android 10-12): No storage permission needed; DownloadManager writes to
 *                             the public Downloads dir automatically.
 *  API 33+  (Android 13+) : Same — no storage permission needed for Downloads dir.
 *
 * Because DownloadManager runs in a separate system process, the download continues
 * even if the user backgrounded or killed our app.
 */
class InvoiceDownloadModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "InvoiceDownloadModule"

    /**
     * Enqueue a PDF download via Android's DownloadManager.
     *
     * @param url        Full URL of the invoice PDF endpoint.
     * @param authToken  Bearer token sent as an Authorization header.
     * @param orderId    Logical order ID used to form the file name:  Invoice_<orderId>.pdf
     * @param promise    Resolves with the DownloadManager enqueue ID (Long as Double),
     *                   or rejects with an error message.
     */
    @ReactMethod
    fun downloadInvoice(url: String, authToken: String, orderId: String, promise: Promise) {
        try {
            val fileName = "Invoice_$orderId.pdf"

            val request = DownloadManager.Request(Uri.parse(url)).apply {
                // --- Authentication header ---
                addRequestHeader("Authorization", "Bearer $authToken")

                // --- Notification behaviour (mirrors Chrome) ---
                setTitle(fileName)
                setDescription("Downloading invoice…")
                setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                )

                // --- Destination: public Downloads folder ---
                // Environment.DIRECTORY_DOWNLOADS resolves to  /sdcard/Download  on all devices.
                // On API 29+ this uses MediaStore internally, so the file shows up immediately
                // in Files / Downloads without needing a media scan.
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)

                // Mark the file as scannable so it appears in media/file apps on API < 29.
                @Suppress("DEPRECATION")
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                    allowScanningByMediaScanner()
                }

                // Allow both Wi-Fi and mobile data (matches Chrome's default).
                setAllowedOverMetered(true)
                setAllowedOverRoaming(true)

                // MIME type lets the system choose the right app when opening.
                setMimeType("application/pdf")
            }

            val dm = reactContext.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val downloadId = dm.enqueue(request)

            // Resolve immediately — DownloadManager now owns the download.
            // The system will show progress + completion notifications automatically.
            promise.resolve(downloadId.toDouble())

        } catch (e: Exception) {
            promise.reject("DOWNLOAD_ERROR", e.message ?: "Unknown error", e)
        }
    }
}
