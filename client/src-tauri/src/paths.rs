use std::path::{Path, PathBuf};

pub struct Context<'a> {
    pub base: &'a Path,
    pub root: &'a Path,
}

fn escaped(path: &Path) -> String {
    glob::Pattern::escape(&path.to_string_lossy())
}

pub fn resolve(raw: &str, ctx: &Context) -> Option<String> {
    let replacements = [
        ("<winLocalAppData>", dirs::data_local_dir()?),
        ("<winAppData>", dirs::config_dir()?),
        ("<winDocuments>", dirs::document_dir()?),
        ("<home>", dirs::home_dir()?),
        ("<base>", ctx.base.to_path_buf()),
        ("<root>", ctx.root.to_path_buf()),
    ];

    let mut path = raw.to_string();
    for (placeholder, value) in replacements {
        path = path.replace(placeholder, &escaped(&value));
    }
    path = path.replace("<storeUserId>", "*");

    if path.contains('<') {
        return None;
    }
    Some(path)
}

pub fn find_existing(pattern: &str) -> Vec<PathBuf> {
    match glob::glob(pattern) {
        Ok(paths) => paths.filter_map(Result::ok).collect(),
        Err(_) => Vec::new(),
    }
}