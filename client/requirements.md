## Packages
react-markdown | Rendering markdown from the agent
remark-gfm | GitHub Flavored Markdown support for react-markdown
framer-motion | For smooth animations of messages and tools
lucide-react | Icons for the interface (already in base, but listing for clarity)
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind classes efficiently

## Notes
WebSocket connects to /ws/chat (proxied to backend port 8000)
Protocol: Send `{"message": "user input"}`
Receive: Stream of `AgentEvent` objects
Components need to handle streaming tokens and tool execution states visually
Dark mode is the default aesthetic
