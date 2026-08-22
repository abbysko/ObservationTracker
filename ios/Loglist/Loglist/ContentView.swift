import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        LoglistWebView()
            .ignoresSafeArea()
    }
}

private struct LoglistWebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

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
        webView.uiDelegate = context.coordinator
        webView.scrollView.pinchGestureRecognizer?.isEnabled = false

        let startURL = URL(string: "loglist://app/index.html")!
        webView.load(URLRequest(url: startURL))

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKUIDelegate {
        func webView(
            _ webView: WKWebView,
            runJavaScriptConfirmPanelWithMessage message: String,
            initiatedByFrame frame: WKFrameInfo,
            completionHandler: @escaping (Bool) -> Void
        ) {
            guard let presenter = webView.window?.rootViewController else {
                completionHandler(false)
                return
            }

            let alert = UIAlertController(
                title: "Confirm",
                message: message,
                preferredStyle: .alert
            )
            alert.addAction(
                UIAlertAction(title: "Cancel", style: .cancel) { _ in
                    completionHandler(false)
                }
            )
            alert.addAction(
                UIAlertAction(title: "OK", style: .default) { _ in
                    completionHandler(true)
                }
            )
            presenter.present(alert, animated: true)
        }
    }
}