import {AiEditor} from "aieditor";
import "aieditor/dist/style.css"

new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to Input Content...",
    content: 'AiEditor is an Open Source Rich Text Editor Designed for AI. ',
    ai: {
        models: {
            spark: {
                appId: "***",
                apiKey: "***",
                apiSecret: "***",
            }
        }
    }
})