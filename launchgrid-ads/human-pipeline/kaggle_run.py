"""Run the Wan 2.1 human b-roll batch on Kaggle's free GPU via the API.

Prereq (one-time): kaggle.json at %USERPROFILE%\\.kaggle\\kaggle.json
(Kaggle → Settings → API → Create New Token). The account must be
phone-verified to get GPU + internet in kernels.

Usage (from launchgrid-ads/human-pipeline/):
  python kaggle_run.py push      # build kernel from prompts.json and start the run
  python kaggle_run.py status    # poll the run state
  python kaggle_run.py pull      # download finished MP4s into ../public/clips/
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
BUILD = HERE / "kaggle_build"
CLIPS = HERE.parent / "public" / "clips"
# NB: Kaggle derives the slug from the kernel title, not the metadata id
SLUG = "launchgrid-human-b-roll-wan-2-1"


def username():
    cfg = Path.home() / ".kaggle" / "kaggle.json"
    if cfg.exists():
        return json.loads(cfg.read_text())["username"]
    # new-style access_token auth: username comes from `kaggle config view`
    out = subprocess.run(
        [sys.executable, "-m", "kaggle", "config", "view"],
        capture_output=True, text=True, check=True,
    ).stdout
    for line in out.splitlines():
        if "username:" in line:
            return line.split("username:")[1].strip()
    sys.exit("could not determine Kaggle username — is the token saved? (kaggle config view)")


def kernel_id():
    return f"{username()}/{SLUG}"


def cells(spec_json: str):
    """Kaggle notebook cells. prompts.json is inlined so no dataset attach is needed."""
    c1 = "!nvidia-smi\n%pip install -q \"diffusers>=0.33\" transformers accelerate ftfy imageio imageio-ffmpeg sentencepiece"
    c2 = (
        "import torch\n"
        "from diffusers import AutoencoderKLWan, WanPipeline\n\n"
        "MODEL = 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers'\n"
        "vae = AutoencoderKLWan.from_pretrained(MODEL, subfolder='vae', torch_dtype=torch.float32)\n"
        "pipe = WanPipeline.from_pretrained(MODEL, vae=vae, torch_dtype=torch.float16)\n"
        "# UMT5-XXL (~13GB fp16) OOMs a 15GB T4 under model offload — stream modules instead\n"
        "pipe.enable_sequential_cpu_offload()"
    )
    c3 = (
        "import json, os\n"
        "from pathlib import Path\n"
        "from diffusers.utils import export_to_video\n\n"
        f"spec = json.loads(r'''{spec_json}''')\n"
        "os.makedirs('out', exist_ok=True)\n"
        "d = spec['defaults']\n"
        "for clip in spec['clips']:\n"
        "    dst = f\"out/{clip['id']}.mp4\"\n"
        "    if Path(dst).exists():\n"
        "        print('skip', dst); continue\n"
        "    print('generating', clip['id'], '...', flush=True)\n"
        "    frames = pipe(\n"
        "        prompt=clip['prompt'],\n"
        "        negative_prompt=spec['negative'],\n"
        "        width=clip.get('width', d['width']),\n"
        "        height=clip.get('height', d['height']),\n"
        "        num_frames=clip.get('num_frames', d['num_frames']),\n"
        "        num_inference_steps=clip.get('steps', d['steps']),\n"
        "        guidance_scale=clip.get('guidance', d['guidance']),\n"
        "        generator=torch.Generator('cuda').manual_seed(clip.get('seed', 42)),\n"
        "    ).frames[0]\n"
        "    export_to_video(frames, dst, fps=clip.get('fps', d['fps']))\n"
        "    print('wrote', dst, flush=True)\n"
        "print('ALL DONE')"
    )
    return [c1, c2, c3]


def cmd_push(only: str | None = None):
    spec_path = HERE / "prompts.json"
    spec = json.loads(spec_path.read_text())  # validate before inlining
    if only:
        spec["clips"] = [c for c in spec["clips"] if c["id"] == only]
        if not spec["clips"]:
            sys.exit(f"no clip with id '{only}' in prompts.json")
        print(f"limiting run to clip: {only}")
    spec_json = json.dumps(spec)
    if "'''" in spec_json:
        sys.exit("prompts.json must not contain triple quotes")

    BUILD.mkdir(exist_ok=True)
    nb = {
        "cells": [
            {"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [], "source": src}
            for src in cells(spec_json)
        ],
        "metadata": {"kernelspec": {"display_name": "Python 3", "name": "python3"}, "language_info": {"name": "python"}},
        "nbformat": 4,
        "nbformat_minor": 4,
    }
    (BUILD / "kernel.ipynb").write_text(json.dumps(nb), encoding="utf-8")
    (BUILD / "kernel-metadata.json").write_text(json.dumps({
        "id": kernel_id(),
        "title": "LaunchGrid human b-roll (Wan 2.1)",
        "code_file": "kernel.ipynb",
        "language": "python",
        "kernel_type": "notebook",
        "is_private": True,
        "enable_gpu": True,
        # P100 (sm_60) is unsupported by Kaggle's CUDA-13 torch build — force T4 (sm_75)
        "machine_shape": "NvidiaTeslaT4",
        "enable_internet": True,
        "dataset_sources": [],
        "competition_sources": [],
        "kernel_sources": [],
    }, indent=2), encoding="utf-8")

    subprocess.run([sys.executable, "-m", "kaggle", "kernels", "push", "-p", str(BUILD)], check=True)
    print(f"\npushed: https://www.kaggle.com/code/{kernel_id()}")
    print("poll with: python kaggle_run.py status")


def cmd_status():
    subprocess.run([sys.executable, "-m", "kaggle", "kernels", "status", kernel_id()], check=True)


def cmd_pull():
    tmp = HERE / "kaggle_out"
    tmp.mkdir(exist_ok=True)
    subprocess.run([sys.executable, "-m", "kaggle", "kernels", "output", kernel_id(), "-p", str(tmp)], check=True)
    CLIPS.mkdir(parents=True, exist_ok=True)
    moved = 0
    for mp4 in tmp.rglob("*.mp4"):
        shutil.copy2(mp4, CLIPS / mp4.name)
        moved += 1
        print("-> public/clips/" + mp4.name)
    print(f"\n{moved} clip(s) in {CLIPS}")


if __name__ == "__main__":
    actions = {"push": cmd_push, "status": cmd_status, "pull": cmd_pull}
    if len(sys.argv) < 2 or sys.argv[1] not in actions:
        sys.exit(__doc__)
    if sys.argv[1] == "push" and len(sys.argv) == 3:
        cmd_push(sys.argv[2])  # push <clip-id> = run a single clip
    else:
        actions[sys.argv[1]]()
