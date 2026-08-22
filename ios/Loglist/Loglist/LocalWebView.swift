import Foundation
import WebKit

final class LocalWebViewHandler: NSObject, WKURLSchemeHandler {
    private let bundle: Bundle

    init(bundle: Bundle = .main) {
        self.bundle = bundle
        super.init()
    }

    func webView(
        _ webView: WKWebView,
        start urlSchemeTask: any WKURLSchemeTask
    ) {
        guard
            let url = urlSchemeTask.request.url,
            url.host == "app"
        else {
            urlSchemeTask.didFailWithError(
                NSError(
                    domain: "LocalWebView",
                    code: 1,
                    userInfo: [
                        NSLocalizedDescriptionKey: "Invalid local web URL"
                    ]
                )
            )
            return
        }

        let relativePath = url.path
            .trimmingCharacters(in: CharacterSet(charactersIn: "/"))

        guard
            let webRoot = bundle.url(
                forResource: "web",
                withExtension: nil
            )
        else {
            urlSchemeTask.didFailWithError(
                NSError(
                    domain: "LocalWebView",
                    code: 2,
                    userInfo: [
                        NSLocalizedDescriptionKey: "The web folder is missing from the app bundle"
                    ]
                )
            )
            return
        }

        let fileURL = webRoot
            .appendingPathComponent(relativePath)
            .standardizedFileURL

        guard fileURL.path.hasPrefix(webRoot.standardizedFileURL.path) else {
            urlSchemeTask.didFailWithError(
                NSError(
                    domain: "LocalWebView",
                    code: 3,
                    userInfo: [
                        NSLocalizedDescriptionKey: "Invalid local web path"
                    ]
                )
            )
            return
        }

        do {
            let data = try Data(contentsOf: fileURL)
            let mimeType = Self.mimeType(for: fileURL.pathExtension)

            guard let response = HTTPURLResponse(
                url: url,
                statusCode: 200,
                httpVersion: "HTTP/1.1",
                headerFields: [
                    "Content-Type": mimeType,
                    "Content-Length": String(data.count)
                ]
            ) else {
                urlSchemeTask.didFailWithError(
                    NSError(
                        domain: "LocalWebView",
                        code: 4,
                        userInfo: [
                            NSLocalizedDescriptionKey: "Could not create local web response"
                        ]
                    )
                )
                return
            }

            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
        } catch {
            urlSchemeTask.didFailWithError(error)
        }
    }

    func webView(
        _ webView: WKWebView,
        stop urlSchemeTask: any WKURLSchemeTask
    ) {}

    private static func mimeType(for pathExtension: String) -> String {
        switch pathExtension.lowercased() {
        case "html":
            return "text/html"
        case "js":
            return "application/javascript"
        case "css":
            return "text/css"
        case "json":
            return "application/json"
        case "svg":
            return "image/svg+xml"
        case "png":
            return "image/png"
        case "jpg", "jpeg":
            return "image/jpeg"
        case "woff":
            return "font/woff"
        case "woff2":
            return "font/woff2"
        default:
            return "application/octet-stream"
        }
    }
}
