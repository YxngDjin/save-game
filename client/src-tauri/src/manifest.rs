use serde::Deserialize;
use std::collections::HashMap;
use std::path::Path;

pub type Manifest = HashMap<String, GameEntry>;

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct GameEntry {
    pub files: HashMap<String, FileEntry>,
    pub steam: Option<SteamInfo>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct FileEntry {
    pub tags: Vec<String>,
    pub when: Vec<Condition>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct Condition {
    pub os: Option<String>,
    pub store: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SteamInfo {
    pub id: Option<u32>,
}

pub fn load(path: &Path) -> Result<Manifest, String> {
    let text = std::fs::read_to_string(path)
        .map_err(|e| format!("Manifest konnte nicht gelesen werden: {e}"))?;
    serde_norway::from_str(&text)
        .map_err(|e| format!("Manifest ist ungültig: {e}"))
}

impl FileEntry {
    pub fn applies_to(&self, os: &str, store: &str) -> bool {
        if self.when.is_empty() {
            return true;
        }
        self.when.iter().any(|c| {
            c.os.as_deref().map_or(true, |o| o == os)
                && c.store.as_deref().map_or(true, |s| s == store)
        })
    }
}

pub fn steam_index(manifest: &Manifest) -> HashMap<u32, &str> {
    manifest
        .iter()
        .filter_map(|(name, entry)| {
            let id = entry.steam.as_ref()?.id?;
            Some((id, name.as_str()))
        })
        .collect()
}