package com.edgepay.app

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.edgepay.app.sms.SmsPackage
import com.edgepay.app.ussd.USSDPackage
import com.edgepay.app.widget.PaymentWidgetPackage
import com.edgepay.app.sim.SimManagerPackage
import com.edgepay.app.accessibility.AccessibilityPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(SmsPackage())
          add(USSDPackage())
          add(PaymentWidgetPackage())
          add(SimManagerPackage())
          add(AccessibilityPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
