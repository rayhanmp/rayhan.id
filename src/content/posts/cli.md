---
title: Why You Should Start Loving the Command Line
description: CLI tools are often avoided like a plague, but they deserve more love.
date: 2025-04-05  
isPublished: true
tags: []
heroImage: '/images/posts/cli.jpg'
heroImageCaption: 'Image by Pexel'
---
When I was just starting my journey as an STI student, I remember being baffled seeing seniors effortlessly glide through black screens filled with obscure commands. "Why not just click buttons like normal people?" I thought. Fast forward a few semesters—here I am, practically living in my terminal. Trust me, learning CLI (Command Line Interface) tools isn't just nerdy cool; it's a game-changer.

## The Real Power of CLI: Efficiency and Control

If you're in your 4th semester and still avoiding the command line, it's time to reconsider. CLI tools are like a Swiss army knife—compact, powerful, and always reliable. As someone who balances a hectic combination of bioinformatics research and web development projects (from FASTQ parsing with `peekq` to managing deployments with Docker), I can't stress enough how critical CLI mastery has become.

For instance, I've spent countless hours tweaking React apps, debugging Python scripts, and wrangling massive genomic datasets. While graphical tools are tempting at first, they soon become clunky. Imagine managing hundreds of files, performing repetitive tasks, or automating complex workflows. One simple Bash script could save you hours.

### Real-world Examples: How CLI Saved My Sanity

- **Bioinformatics with Bash and NextFlow:** Remember my project `peekq`, the FASTQ viewer? Without CLI tools like NextFlow and simple Bash commands (`grep`, `sed`, `awk`), handling massive sequencing data would be nearly impossible.

- **DevOps with Docker & Git:** Deploying to my VPS (shout-out to IDCloudHost!) became seamless after mastering Docker and Git from the terminal. No more endless drag-and-drop or repetitive FTP uploads. One command (`git pull`) and my Astro site goes live effortlessly.

- **Systems Management and Automation:** Automating training sessions for Graph Neural Networks (GNNs) on RunPod required scripts that manage GPU resources effectively. Manual clicking isn't an option when your wallet depends on precise GPU usage!

- **Managing Headless Linux Servers:** Servers often don't even have a graphical user interface. Learning CLI tools like SSH is the only practical way to interact with them.

- **Data Manipulation and Quick Filtering:** Tasks like quickly searching through massive logs or datasets (`grep`), sorting and transforming data (`awk`, `sed`), or viewing file content on remote servers are far simpler via CLI.

- **Batch Processing:** Need to resize thousands of images or convert hundreds of video files? A simple CLI command or script beats manual GUI-based tools every time.

### CLI Speed Wins: Realizing Efficiency

Initially, you might think GUI is faster—until you face tasks that require rapid repetition or large-scale execution. Here are quick examples:

- **Bulk Renaming Files:**

```bash
# Rename 1000 .jpg files from IMG_ to holiday_
for file in IMG_*.jpg; do mv "$file" "${file/IMG_/holiday_}"; done
```

Doing this manually with a GUI? Prepare to lose your afternoon.

- **Quickly Finding a Text Across Multiple Documents:**

```bash
# Instantly search through hundreds of notes for a specific term
grep -r "exam schedule" notes/
```

Compare this to clicking through each file manually, and you'll quickly see the CLI advantage.

### CLI Is Portable, GUI Is Not

One of the biggest reasons to learn CLI tools is their **fundamental, transferable nature**. The skills you gain using `bash`, `ssh`, `git`, or `rsync` don't depend on a specific software brand. Once you know how to use them, you can jump between Mac, Linux, WSL, or any headless server and feel right at home.

Meanwhile, GUI tools are often software-specific and version-sensitive. Learn one GUI file manager, and you’ll have to relearn another on a different OS. Know how to use a GUI-based Git client? That knowledge may not carry over when the team uses another tool. You end up relearning the same actions, over and over.

With CLI, once you've learned a tool, you unlock productivity everywhere. It’s not just about speed—it’s about long-term efficiency and adaptability.

### A CLI Learning Roadmap

Start small, then grow your toolkit:

- **Beginner:** `ls`, `cd`, `cp`, `mv`, `rm`, `nano`, `cat`
- **Intermediate:** `grep`, `find`, `awk`, `sed`, pipes (`|`), redirects (`>`, `<`, `>>`)
- **Advanced:** Bash scripting, `cron`, `tmux`, `systemctl`, Git CLI
- **Bonus:** Customize your shell with `.bashrc` or `.zshrc`, create aliases, and optimize your workflow

### My CLI Stack (In Case You're Curious)

I mostly use `bash`, paired with WSL on Windows and SSH into my VPS. I’ve aliased repetitive commands like syncing datasets, pushing code, or restarting servers. My terminal is set up with `tmux` and a minimal `htop` overlay to keep resource usage in check.

### Common CLI Misconceptions

- "Only Linux people use it." — Wrong. macOS and WSL make it accessible to everyone.
- "Outdated." — Tell that to every cloud infrastructure and bioinformatics pipeline in production.
- "Too hard to learn." — CLI commands are often easier and more predictable than GUI quirks.

### CLI-First Tools You Should Know Exist

Many of the most powerful tools are CLI-only:
- `ffmpeg` — audio/video processing
- `yt-dlp` — YouTube downloader
- `rsync` — blazing fast file transfer and backup
- `wget` & `curl` — downloading files and API testing
- `jq` — process JSON data like a breeze
- `pandoc` — convert Markdown to PDF, DOCX, HTML, etc.

### Practical CLI Commands Every STI Student Should Know

Here are some essential CLI commands that you'll find incredibly useful:

**File Management:**
```bash
# Copy all .txt files to a backup folder
cp *.txt ~/backup/

# Find large files (>100MB)
find . -type f -size +100M
```

**Search and Replace:**
```bash
# Find all occurrences of 'error' in log files
grep -rin "error" /var/log/

# Replace 'old' with 'new' in a file
sed -i 's/old/new/g' file.txt
```

**System Monitoring:**
```bash
# Check system resource usage
htop

# Check disk usage
df -h
```

**Networking and Remote Access:**
```bash
# Securely connect to a remote server
ssh user@remote-server.com

# Check if a website is up
curl -I https://rayhan.id
```

### Fun Stuff You Can Do with CLI

- Generate a QR code:
```bash
echo "https://rayhan.id" | qrencode -o qrcode.png
```

- Play retro ASCII games:
```bash
ninvaders
```

- Create a PDF from Markdown:
```bash
pandoc notes.md -o notes.pdf
```

### Cheat Sheets and Resources

- [https://explainshell.com](https://explainshell.com) — explains any CLI command
- [https://cheat.sh](https://cheat.sh) — community-driven command cheat sheets
- `tldr` — install with `npm i -g tldr`, then try `tldr tar`
- `man` — your built-in command manual: `man grep`
- If you’re curious, check out my dotfiles (soon to be on GitHub)

### My Recommended CLI Starter Kit

Still skeptical? Here are a few CLI tools every STI student should learn immediately:

- **Git:** Version control without Git CLI is like biology without evolution—chaotic and unintelligible.
- **Docker:** Essential for clean and reproducible development environments. Goodbye, "works on my machine"!
- **tmux:** Manage multiple terminal sessions effortlessly.
- **htop:** Monitor system resources in real-time with elegance.
- **curl/httpie:** Quick and effective API testing directly from your terminal.

### Overcoming CLI Anxiety: Practical Tips

Feeling overwhelmed? Don't worry—I was there too. Here’s my personal recipe for overcoming terminal anxiety:

1. **Aliases and Shortcuts:** Define shortcuts for frequent commands. Your fingers will thank you.
2. **Consistent Practice:** Spend just 15 minutes a day using CLI tools.
3. **Real-world Tasks:** Apply CLI commands to your daily tasks or projects. Practical experience beats theory every time.

### Why Bother? Future-proofing Your Career

Employers love candidates fluent in CLI tools—not because it's trendy, but because it's powerful. Whether you're venturing into MLOps, bioinformatics, cybersecurity, or DevOps, CLI proficiency sets you apart.

Learning CLI transformed me from a hesitant beginner into someone capable of tackling interdisciplinary problems efficiently. And trust me, in a rapidly evolving tech landscape, that makes all the difference.

### Your First Challenge (If You Dare)

Open your terminal and try this:
```bash
mkdir testcli && cd testcli
touch file{1..5}.py
echo "import os" >> file3.py
grep -r "import" . > summary.txt
```
Congratulations—you just created a directory, added some files, inserted content, and filtered it, all from CLI. That's the start of real power.

So, embrace the terminal. It might feel a bit awkward at first—but so did your first "Hello World," right?





