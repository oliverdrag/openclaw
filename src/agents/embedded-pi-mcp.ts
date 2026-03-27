import type { OpenClawConfig } from "../config/config.js";
import { normalizeConfiguredMcpServers } from "../config/mcp-config.js";
import type { BundleMcpDiagnostic, BundleMcpServerConfig } from "../plugins/bundle-mcp.js";
import { loadEnabledBundleMcpConfig } from "../plugins/bundle-mcp.js";

export type EmbeddedPiMcpConfig = {
  mcpServers: Record<string, BundleMcpServerConfig>;
  diagnostics: BundleMcpDiagnostic[];
};

export function loadEmbeddedPiMcpConfig(params: {
  workspaceDir: string;
  cfg?: OpenClawConfig;
  /** Per-agent MCP server allow-list. Omit or `["*"]` = all; `[]` = none. */
  mcpServerAllowList?: string[];
}): EmbeddedPiMcpConfig {
  const bundleMcp = loadEnabledBundleMcpConfig({
    workspaceDir: params.workspaceDir,
    cfg: params.cfg,
  });
  const configuredMcp = normalizeConfiguredMcpServers(params.cfg?.mcp?.servers);

  let mcpServers: Record<string, BundleMcpServerConfig> = {
    // OpenClaw config is the owner-managed layer, so it overrides bundle defaults.
    ...bundleMcp.config.mcpServers,
    ...configuredMcp,
  };

  // Apply per-agent MCP server filtering when an allow-list is provided.
  const allowList = params.mcpServerAllowList;
  if (allowList && !allowList.includes("*")) {
    const allowed = new Set(allowList.map((s) => s.toLowerCase()));
    const filtered: Record<string, BundleMcpServerConfig> = {};
    for (const [name, server] of Object.entries(mcpServers)) {
      if (allowed.has(name.toLowerCase())) {
        filtered[name] = server;
      }
    }
    mcpServers = filtered;
  }

  return {
    mcpServers,
    diagnostics: bundleMcp.diagnostics,
  };
}
