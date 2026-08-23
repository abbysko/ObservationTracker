import SwiftUI
import WebKit

struct ContentView: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .bottom) {
                pageBackgroundColor
                    .ignoresSafeArea(edges: .top)
                LoglistWebView()

                navigationBackgroundColor
                    .frame(height: geometry.safeAreaInsets.bottom)
                    .offset(y: geometry.safeAreaInsets.bottom)
            }
        }
    }

    private var pageBackgroundColor: Color {
        Color(
            red: colorScheme == .dark ? 0.043 : 0.969,
            green: colorScheme == .dark ? 0.043 : 0.969,
            blue: colorScheme == .dark ? 0.047 : 0.973
        )
    }

    private var navigationBackgroundColor: Color {
        Color(
            red: colorScheme == .dark ? 0.138 : 0.909,
            green: colorScheme == .dark ? 0.139 : 0.909,
            blue: colorScheme == .dark ? 0.200 : 0.992
        )
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
        webView.scrollView.bounces = false
        webView.scrollView.alwaysBounceVertical = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never

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

        func webView(
            _ webView: WKWebView,
            runJavaScriptTextInputPanelWithPrompt prompt: String,
            defaultText: String?,
            initiatedByFrame frame: WKFrameInfo,
            completionHandler: @escaping (String?) -> Void
        ) {
            guard let presenter = webView.window?.rootViewController else {
                completionHandler(nil)
                return
            }

            let alert = UIAlertController(
                title: nil,
                message: prompt,
                preferredStyle: .alert
            )
            alert.addTextField { textField in
                textField.text = defaultText
            }
            alert.addAction(
                UIAlertAction(title: "Cancel", style: .cancel) { _ in
                    completionHandler(nil)
                }
            )
            alert.addAction(
                UIAlertAction(title: "OK", style: .default) { _ in
                    completionHandler(alert.textFields?.first?.text)
                }
            )
            presenter.present(alert, animated: true) {
                alert.textFields?.first?.becomeFirstResponder()
            }
        }
    }
}