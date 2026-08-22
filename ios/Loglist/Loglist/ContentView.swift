import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        LoglistWebView()
            .ignoresSafeArea()
    }
}

private struct LoglistWebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        configuration.setURLSchemeHandler(
            LocalWebViewHandler(),
            forURLScheme: "loglist"
        )

        let webView = WKWebView(
            frame: .zero,
            configuration: configuration
        )

        let startURL = URL(string: "loglist://app/index.html")!
        webView.load(URLRequest(url: startURL))

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}
}