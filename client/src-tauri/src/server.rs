use serde::{Deserialize, Serialize};
use std::time::Duration;
use serde_json::Value;
use reqwest::multipart::{Form, Part};
use std::path::Path;

use crate::backup::BackupInfo;

#[derive(Debug, Serialize, Deserialize)]
pub struct Health {
    pub status: String,
    pub devices: u64,
    pub games: u64,
    pub backups: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ClaimRequest<'a> {
    code: &'a str,
    device_name: &'a str,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaimResponse {
    pub device_id: String,
    pub device_name: String,
    pub token: String,
}

#[derive(Deserialize)]
struct ErrorBody {
    message: Value,
}

async fn error_message(response: reqwest::Response) -> String {
    let status = response.status();
    match response.json::<ErrorBody>().await {
        Ok(body) => match body.message {
            Value::String(text) => text,
            Value::Array(items) => items
                .iter()
                .filter_map(|item| item.as_str())
                .collect::<Vec<_>>()
                .join(", "),
            other => other.to_string(),
        },
        Err(_) => format!("Server antwortet mit Status {status}"),
    }
}

pub async fn claim(base_url: &str, code: &str, device_name: &str) -> Result<ClaimResponse, String> {
    let response = client()?
        .post(format!("{base_url}/pairing/claim"))
        .json(&ClaimRequest { code, device_name })
        .send()
        .await
        .map_err(|e| format!("Server nicht erreichbar: {e}"))?;

    if !response.status().is_success() {
        return Err(error_message(response).await);
    }

    response
        .json::<ClaimResponse>()
        .await
        .map_err(|e| format!("Unerwartete Antwort vom Server: {e}"))
}


pub fn normalize_url(url: &str) -> Result<String, String> {
    let url = url.trim().trim_end_matches('/');
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err("Die Adresse muss mit http:// oder https:// beginnen".to_string());
    }
    Ok(url.to_string())
}

fn client_with_timeout(seconds: u64) -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(seconds))
        .build()
        .map_err(|e| e.to_string())
}

fn client() -> Result<reqwest::Client, String> {
    client_with_timeout(10)
}

pub async fn check_health(base_url: &str) -> Result<Health, String> {
    let response = client()?
        .get(format!("{base_url}/health"))
        .send()
        .await
        .map_err(|e| format!("Server nicht erreichbar: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("Server antwortet mit Status {}", response.status()));
    }

    response
        .json::<Health>()
        .await
        .map_err(|e| format!("Unerwartete Antwort vom Server: {e}"))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadResponse {
    pub duplicate: bool,
}

pub async fn upload_backup(
    base_url: &str,
    token: &str,
    zip_path: &Path,
    info: &BackupInfo,
) -> Result<UploadResponse, String> {
    if info.manifest_name.is_empty() || info.content_hash.is_empty() {
        return Err("Dieses Backup ist zu alt für den Upload".to_string());
    }

    let bytes = std::fs::read(zip_path).map_err(|e| format!("ZIP konnte nicht gelesen werden: {e}"))?;
    let file_name = zip_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("backup.zip")
        .to_string();

    let file = Part::bytes(bytes)
        .file_name(file_name)
        .mime_str("application/zip")
        .map_err(|e| e.to_string())?;

    let form = Form::new()
        .text("manifestName", info.manifest_name.clone())
        .text("displayName", info.game_name.clone())
        .text("contentHash", info.content_hash.clone())
        .text("launcher", info.launcher.clone())
        .text("launcherId", info.launcher_id.clone())
        .text("reason", info.reason.clone())
        .text("fileCount", info.files.len().to_string())
        .text("sizeBytes", info.files.iter().map(|f| f.size).sum::<u64>().to_string())
        .text("createdAt", info.created_at.clone())
        .part("file", file);

    let response = client_with_timeout(600)?
        .post(format!("{base_url}/backups"))
        .bearer_auth(token)
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("Server nicht erreichbar: {e}"))?;

    if !response.status().is_success() {
        return Err(error_message(response).await);
    }

    response
        .json::<UploadResponse>()
        .await
        .map_err(|e| format!("Unerwartete Antwort vom Server: {e}"))
}