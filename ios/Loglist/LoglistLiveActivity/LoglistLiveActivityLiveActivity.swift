//
//  LoglistLiveActivityLiveActivity.swift
//  LoglistLiveActivity
//
//  Created by Abigail Skofield on 8/22/26.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct LoglistLiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct LoglistLiveActivityLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: LoglistLiveActivityAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension LoglistLiveActivityAttributes {
    fileprivate static var preview: LoglistLiveActivityAttributes {
        LoglistLiveActivityAttributes(name: "World")
    }
}

extension LoglistLiveActivityAttributes.ContentState {
    fileprivate static var smiley: LoglistLiveActivityAttributes.ContentState {
        LoglistLiveActivityAttributes.ContentState(emoji: "😀")
    }

     fileprivate static var starEyes: LoglistLiveActivityAttributes.ContentState {
         LoglistLiveActivityAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: LoglistLiveActivityAttributes.preview) {
   LoglistLiveActivityLiveActivity()
} contentStates: {
    LoglistLiveActivityAttributes.ContentState.smiley
    LoglistLiveActivityAttributes.ContentState.starEyes
}
