package `in`.launchgrid.mobile

import android.app.Application
import `in`.launchgrid.mobile.data.Graph
import `in`.launchgrid.mobile.push.Push

class LaunchGridApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Graph.init(this)
        Push.ensureChannel(this)
    }
}
