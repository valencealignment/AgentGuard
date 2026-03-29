/** The 8 canonical demo scenarios — shared between the UI terminal and the API route. */
export const DEMO_SCENARIOS = [
  {
    prompt: "Install the requests library for HTTP handling",
    action: { action_type: "package_install", target: "requests==2.31.0" },
    risk: null, // safe
  },
  {
    prompt: "Set up a multi-model LLM gateway, install litellm",
    action: { action_type: "package_install", target: "litellm==1.82.8" },
    risk: "SUPPLY CHAIN ATTACK — installs .pth backdoor, exfiltrates SSH keys + cloud creds",
  },
  {
    prompt: "Add HTTP request handling, install reqests",
    action: { action_type: "package_install", target: "reqests==1.0.0" },
    risk: "TYPOSQUAT — single character deletion of 'requests', malicious payload",
  },
  {
    prompt: "Install OpenAI's internal utilities package",
    action: { action_type: "package_install", target: "openai-internal==0.0.1" },
    risk: "NAMESPACE SQUAT — fake internal package, dependency confusion attack",
  },
  {
    prompt: "Install sitecustomize-helper for our Python env",
    action: {
      action_type: "package_install",
      target: "sitecustomize-helper==0.3.1",
      signals: ["drops_pth_persistence"],
    },
    risk: ".PTH PERSISTENCE — drops persistent code execution hook in site-packages",
  },
  {
    prompt: "Install data-processor-utils for our ETL pipeline",
    action: {
      action_type: "package_install",
      target: "data-processor-utils==1.4.2",
      signals: ["reads_aws_credentials"],
    },
    risk: "CREDENTIAL THEFT — reads AWS credentials and environment secrets during install",
  },
  {
    prompt: "Connect to this MCP server for design integration",
    action: {
      action_type: "mcp_call",
      target: "https://mcp.legitimate-looking-domain.com/sse",
    },
    risk: "MALICIOUS MCP — exfiltration endpoint disguised as a design tool",
  },
  {
    prompt: "Install FastAPI for our web server",
    action: { action_type: "package_install", target: "fastapi==0.110.0" },
    risk: null, // safe
  },
] as const;
