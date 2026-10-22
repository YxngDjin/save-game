use keyring::Entry;

const SERVICE: &str = "com.yxngdjin.savegames";
const USER: &str = "device-token";

fn entry() -> Result<Entry, String> {
    Entry::new(SERVICE, USER).map_err(|e| e.to_string())
}

pub fn save_token(token: &str) -> Result<(), String> {
    entry()?.set_password(token).map_err(|e| e.to_string())
}

pub fn load_token() -> Option<String> {
    entry().ok()?.get_password().ok()
}

pub fn delete_token() -> Result<(), String> {
    match entry()?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string())
    }
}