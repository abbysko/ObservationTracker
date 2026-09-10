import SwiftUI
import WebKit
import UIKit

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
        configuration.userContentController.add(
            context.coordinator,
            name: "shareSession"
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

        let startURL = URL(string: "loglist://app/app.html")!
        webView.load(URLRequest(url: startURL))

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKUIDelegate, WKScriptMessageHandler {
        func userContentController(
            _ userContentController: WKUserContentController,
            didReceive message: WKScriptMessage
        ) {
            guard
                message.name == "shareSession",
                let payload = message.body as? [String: Any],
                let csv = payload["csv"] as? String
            else {
                return
            }

            let filename = (payload["filename"] as? String) ?? "session-observations.csv"
            let fileURL = FileManager.default.temporaryDirectory
                .appendingPathComponent(filename)

            do {
                try csv.write(to: fileURL, atomically: true, encoding: .utf8)
            } catch {
                return
            }

            DispatchQueue.main.async {
                guard let presenter = self.topViewController() else { return }
                let activityViewController = UIActivityViewController(
                    activityItems: [fileURL],
                    applicationActivities: nil
                )
                if let popover = activityViewController.popoverPresentationController {
                    popover.sourceView = presenter.view
                    popover.sourceRect = CGRect(
                        x: presenter.view.bounds.midX,
                        y: presenter.view.bounds.midY,
                        width: 0,
                        height: 0
                    )
                }
                presenter.present(activityViewController, animated: true)
            }
        }

        private func topViewController(
            from root: UIViewController? = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .first(where: { $0.isKeyWindow })?.rootViewController
        ) -> UIViewController? {
            if let presented = root?.presentedViewController {
                return topViewController(from: presented)
            }
            if let navigation = root as? UINavigationController {
                return topViewController(from: navigation.visibleViewController)
            }
            if let tab = root as? UITabBarController {
                return topViewController(from: tab.selectedViewController)
            }
            return root
        }

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