import os
import tarfile
import zipfile
import shutil

def extract_and_resolve(archive_path, output_dir="extracted"):
    # Ensure clean output folder
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir, exist_ok=True)

    # Extract archive
    if archive_path.endswith(".tar.gz") or archive_path.endswith(".tgz"):
        with tarfile.open(archive_path, "r:gz") as tar:
            tar.extractall(output_dir)
    elif archive_path.endswith(".zip"):
        with zipfile.ZipFile(archive_path, "r") as zip_ref:
            zip_ref.extractall(output_dir)
    else:
        raise ValueError("Unsupported file type. Use .tar.gz or .zip")

    print(f"Extracted {archive_path} → {output_dir}")

    # Walk through extracted files and resolve symlinks
    for root, dirs, files in os.walk(output_dir):
        for name in dirs + files:
            path = os.path.join(root, name)
            if os.path.islink(path):
                target = os.readlink(path)
                abs_target = os.path.abspath(os.path.join(root, target))

                print(f"Resolving symlink: {path} -> {target}")

                # Remove symlink
                os.remove(path)

                # If target exists, copy as real folder/file
                if os.path.exists(abs_target):
                    if os.path.isdir(abs_target):
                        shutil.copytree(abs_target, path)
                    else:
                        shutil.copy2(abs_target, path)
                else:
                    print(f"⚠️ Broken symlink skipped: {path}")

    print("✅ Extraction complete. Symlinks resolved into real files.")

# Example usage:
# extract_and_resolve("project.tar.gz")
# extract_and_resolve("project.zip")
