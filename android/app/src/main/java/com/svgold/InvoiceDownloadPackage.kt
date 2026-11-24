package com.svgold

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * InvoiceDownloadPackage
 *
 * Registers [InvoiceDownloadModule] with the React Native bridge so that
 * JavaScript can call  NativeModules.InvoiceDownloadModule.*
 */
class InvoiceDownloadPackage : ReactPackage {

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> = listOf(InvoiceDownloadModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> = emptyList()
}
