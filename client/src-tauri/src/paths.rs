use std::path::{Component, Path, PathBuf};

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

pub fn to_portable(path: &Path, ctx: &Context) -> Option<String> {
    let candidates = [
        ("<base>", Some(ctx.base.to_path_buf())),
        ("<root>", Some(ctx.root.to_path_buf())),
        ("<winLocalAppData>", dirs::data_local_dir()),
        ("<winAppData>", dirs::config_dir()),
        ("<winDocuments>", dirs::document_dir()),
        ("<home>", dirs::home_dir()),
    ];

    for (placeholder, dir) in candidates {
        let Some(dir) = dir else { continue };
        if let Ok(rest) = path.strip_prefix(&dir) {
            let rest = rest.to_string_lossy().replace('\\', "/");
            return Some(format!("{placeholder}/{rest}"));
        }
    }
    None
}

pub fn from_portable(protable: &str, ctx: &Context) -> Option<PathBuf> {
    let (placeholder, rest) = protable.split_once('/')?;

    let base = match placeholder {
        "<base>" => ctx.base.to_path_buf(),
        "<root>" => ctx.root.to_path_buf(),
        "<winLocalAppData>" => dirs::data_local_dir()?,
        "<winAppData>" => dirs::config_dir()?,
        "<winDocuments>" => dirs::document_dir()?,
        "<home>" => dirs::home_dir()?,
        _ => return None,
    };

    let rest = Path::new(rest);
    if rest
        .components()
        .any(|c| !matches!(c, Component::Normal(_)))
    {
        return None;
    }

    Some(base.join(rest))
}
