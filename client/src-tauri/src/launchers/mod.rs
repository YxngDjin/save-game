use serde::Serialize;
use std::path::PathBuf;

pub mod steam;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]

pub struct Game {
    pub name: String,
    pub launcher: String,
    pub launcher_id: String,
    pub install_dir: PathBuf
}
