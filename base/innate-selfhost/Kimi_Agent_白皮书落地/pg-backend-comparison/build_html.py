# -*- coding: utf-8 -*-
"""Convert the final Markdown report into a styled HTML for Paged.js PDF."""
import re
import markdown

SRC = "/mnt/agents/output/pg-backend-comparison.agent.final.md"
OUT = "/mnt/agents/output/pg-backend-comparison/report.html"

text = open(SRC, encoding="utf-8").read()

# ---- 1. Split off the appendix source list (footnote definitions) ----
# Footnote definition lines: [^N^]: ...
fn_pattern = re.compile(r"^\[\^(\d+)\^\]:\s*(.+?)(?=^\[\^\d+\^\]:|\Z)", re.M | re.S)
footnotes = {}
for m in fn_pattern.finditer(text):
    fid = m.group(1)
    body = m.group(2).strip()
    footnotes[fid] = body
body_md = fn_pattern.sub("", text)

# ---- 2. Remove the hand-written TOC section; we rebuild it ----
body_md = re.sub(r"## 目录\n.*?(?=\n---)", "", body_md, flags=re.S)

# ---- 3. Strip the header block (title/subtitle/date) — used on cover ----
head_m = re.match(r"# (.+?)\n\n> \*\*副标题\*\*：(.+?)\n> \*\*日期\*\*：(.+?)　\*\*版本\*\*：(.+?)\n", body_md)
title, subtitle, date, version = head_m.group(1), head_m.group(2), head_m.group(3), head_m.group(4)
body_md = body_md[head_m.end():]
# drop everything (stray rules) before the first chapter anchor
body_md = re.sub(r'^[\s\S]*?(?=<a id="ch1"></a>)', "", body_md)

# ---- 4. Convert markdown to HTML ----
html_body = markdown.markdown(
    body_md,
    extensions=["tables", "fenced_code", "sane_lists"],
    output_format="html5",
)

# ---- 5. Post-processing ----
# 5a. anchor ids: the md has <a id="ch1"></a> before h2 — keep, but also add id to following h2
html_body = re.sub(
    r'<p><a id="(ch\d+|appendix)"></a></p>\s*<h2>',
    lambda m: f'<h2 data-anchor="{m.group(1)}">',
    html_body,
)
# remove any leftover empty anchors
html_body = re.sub(r'<p><a id="[^"]+"></a></p>', "", html_body)
html_body = re.sub(r'<a id="[^"]+"></a>', "", html_body)

# 5b. citation markers [^N^] -> superscript links to appendix
def cite_repl(m):
    n = m.group(1)
    return f'<a class="cite" href="#ref-{n}">[{n}]</a>'
html_body = re.sub(r"\[\^(\d+)\^\]", cite_repl, html_body)

# 5c. checkbox list items in 7.2
html_body = html_body.replace("[ ]", '<span class="checkbox"></span>')

# 5d/5e. h2 ids: prefer data-anchor, else auto; mark chapters for page breaks
sec_counter = [0]
def add_h2_id(m):
    tag = m.group(0)
    anchor_m = re.search(r'data-anchor="([^"]+)"', tag)
    hid = anchor_m.group(1) if anchor_m else None
    if hid is None:
        sec_counter[0] += 1
        hid = f"sec-auto-{sec_counter[0]}"
    inner = re.sub(r'\s*data-anchor="[^"]+"', "", tag)
    cls = "chapter" if re.match(r"ch\d+|appendix", hid) else None
    if cls:
        inner = inner.replace("<h2", f'<h2 class="{cls}" id="{hid}"', 1)
    else:
        inner = inner.replace("<h2", f'<h2 id="{hid}"', 1)
    return inner
html_body = re.sub(r"<h2[^>]*>", add_h2_id, html_body)

# ---- 6. Build appendix references list ----
ref_items = []
for fid in sorted(footnotes, key=int):
    body = footnotes[fid]
    # linkify bare URLs and paths
    body = re.sub(r"(https?://[^\s；，）)]+)", r'<a class="url" href="\1">\1</a>', body)
    body = re.sub(r"`([^`]+)`", r"<code>\1</code>", body)
    ref_items.append(f'<li id="ref-{fid}"><span class="refnum">[{fid}]</span> {body}</li>')
refs_html = '<ol class="references">\n' + "\n".join(ref_items) + "\n</ol>"

# Replace the appendix intro paragraph (keep it), append the list after the h2 section content
# The appendix section currently: <h2 id="appendix">附录：来源清单</h2><p>（以下来源...）</p>
html_body = re.sub(
    r'(<h2 class="chapter" id="appendix">附录：来源清单</h2>\s*<p>（以下来源均于 2026-08-16 访问；按正文首次引用顺序编号）</p>)',
    r"\1\n" + refs_html,
    html_body,
)

# ---- 7. Build TOC ----
toc_entries = re.findall(r'<h2 class="chapter" id="([^"]+)">(.+?)</h2>', html_body)
toc_lis = "\n".join(
    f'<li><a href="#{i}"><span class="t">{t}</span><span class="fill"></span></a></li>'
    for i, t in toc_entries)
toc_html = f'''<div class="toc-page">
<h2 class="toc-title">目 录</h2>
<ul class="toc">
{toc_lis}
</ul>
</div>'''

# ---- 8. Cover (Swiss style, warm neutral) ----
cover_html = f'''<div class="cover">
  <div class="cover-grid"></div>
  <div class="cover-corner tl"></div>
  <div class="cover-corner br"></div>
  <div class="cover-accent"></div>
  <div class="cover-content">
    <p class="cover-kicker">技术咨询报告 · TECHNICAL ADVISORY REPORT</p>
    <h1 class="cover-title">{title}</h1>
    <div class="cover-rule"></div>
    <p class="cover-subtitle">{subtitle}</p>
    <div class="cover-meta">
      <p>{date}</p>
      <p>版本 {version}</p>
    </div>
  </div>
  <div class="cover-footer">PostgreSQL 系 AI 原生后端选型 · 六维评估 · 规模分层 · 风险台账</div>
</div>'''

CSS = """
/* ===== Base ===== */
* { box-sizing: border-box; }
body {
    margin: 0; padding: 0;
    font-family: "Noto Serif CJK SC", "Noto Serif SC", serif;
    font-size: 10.5pt; line-height: 1.75; color: #33322e;
    text-align: justify; text-align-last: left;
    string-set: doctitle "";
}
h1 { string-set: doctitle content(); }

@page {
    size: A4;
    margin: 2.4cm 2cm 2.6cm 2cm;
    @top-center { content: string(doctitle); font-family: "Noto Serif CJK SC", serif; font-size: 8.5pt; color: #8a8577; }
    @bottom-center { content: counter(page); font-size: 9pt; color: #8a8577; }
}
@page :first { margin: 0; @top-center { content: none; } @bottom-center { content: none; } }
@page cover { margin: 0; @top-center { content: none; } @bottom-center { content: none; } }
@page toc { @top-center { content: none; } }

/* ===== Cover (Swiss / warm neutral) ===== */
.cover { page: cover; width: 210mm; height: 297mm; margin: 0; position: relative; overflow: hidden;
    background: #faf7f1; page-break-after: always; }
.cover-grid { position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background-image:
        linear-gradient(to right, rgba(120,108,88,0.07) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(120,108,88,0.07) 1px, transparent 1px);
    background-size: 42mm 42mm; }
.cover-corner { position: absolute; width: 26mm; height: 26mm; }
.cover-corner.tl { top: 12mm; left: 12mm; background: #b5a481; }
.cover-corner.br { bottom: 12mm; right: 12mm; background: #3e3a33; }
.cover-accent { position: absolute; top: 12mm; right: 12mm; width: 60mm; height: 4mm; background: #8c5a3c; }
.cover-content { position: absolute; top: 44%; left: 50%; transform: translate(-50%,-50%);
    width: 78%; text-align: left; }
.cover-kicker { font-size: 10pt; letter-spacing: 0.25em; color: #8c5a3c; margin: 0 0 10mm 0; }
.cover-title { font-size: 26pt; font-weight: 700; color: #2e2b26; line-height: 1.4; margin: 0; }
.cover-rule { width: 34mm; height: 1.2mm; background: #b5a481; margin: 9mm 0; }
.cover-subtitle { font-size: 11.5pt; color: #5c574c; line-height: 1.8; margin: 0 0 16mm 0; }
.cover-meta { font-size: 10.5pt; color: #6d6759; line-height: 1.9; }
.cover-meta p { margin: 0; }
.cover-footer { position: absolute; bottom: 16mm; left: 50%; transform: translateX(-50%);
    font-size: 8.5pt; letter-spacing: 0.15em; color: #a39b87; white-space: nowrap; }

/* ===== TOC ===== */
.toc-page { page-break-after: avoid; }
.toc-title { font-size: 18pt; color: #2e2b26; border-bottom: 2px solid #b5a481; padding-bottom: 0.4em; margin-bottom: 1.2em; }
ul.toc { list-style: none; padding: 0; margin: 0; }
ul.toc li { margin: 0.7em 0; font-size: 11.5pt; }
ul.toc a { color: #33322e; text-decoration: none; display: flex; align-items: baseline; }
ul.toc a .fill { flex: 1; border-bottom: 1px dotted #b9b2a2; margin: 0 0.6em; transform: translateY(-0.28em); }
ul.toc a::after { content: target-counter(attr(href url), page); color: #8a8577; }

/* ===== Headings ===== */
h2.chapter { page-break-before: always; }
h2 { font-size: 16pt; color: #2e2b26; border-left: 4px solid #8c5a3c; padding-left: 0.55em;
     margin: 1.4em 0 0.9em 0; page-break-after: avoid; line-height: 1.4; }
h3 { font-size: 12.5pt; color: #3e3a33; margin: 1.3em 0 0.6em 0; page-break-after: avoid;
     border-bottom: 1px solid #ddd6c8; padding-bottom: 0.3em; }
p { margin: 0.65em 0; }
strong { color: #2e2b26; }
hr { border: none; border-top: 1px solid #ddd6c8; margin: 1.2em 0; }

/* ===== Citations ===== */
a.cite { color: #33322e; text-decoration: none; vertical-align: super; font-size: 0.72em; }

/* ===== Code ===== */
code { font-family: "DejaVu Sans Mono", "Noto Sans Mono CJK SC", monospace; font-size: 0.86em;
       background: #f4f1ea; padding: 0.08em 0.35em; word-break: break-word; }
pre { background: #f5f3ee; border: 1px solid #e2dccb; border-left: 3px solid #b5a481;
      padding: 0.8em 1em; font-size: 8.6pt; line-height: 1.55; max-width: 100%;
      overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; page-break-inside: avoid; }
pre code { background: none; padding: 0; }

/* ===== Tables (three-line, booktabs) ===== */
table { border-collapse: collapse; width: 100%; max-width: 100%; margin: 1em 0;
        font-size: 8.8pt; line-height: 1.5; overflow-x: auto; }
thead { display: table-header-group; }
thead tr { border-top: 1.6px solid #3e3a33; border-bottom: 1px solid #3e3a33; }
tbody { border-bottom: 1.6px solid #3e3a33; }
th, td { padding: 0.42em 0.55em; text-align: left; vertical-align: top; }
th { background: #f4f1ea; font-weight: 700; color: #2e2b26; }
tr { page-break-inside: avoid; }
tbody tr:nth-child(even) { background: #faf8f3; }

/* ===== Lists ===== */
ul, ol { padding-left: 1.6em; margin: 0.6em 0; }
li { margin: 0.3em 0; }
li > ul, li > ol { margin: 0.2em 0; }
li::marker { color: #8c5a3c; }

/* checkbox */
.checkbox { display: inline-block; width: 0.85em; height: 0.85em; border: 1.2px solid #8a8577;
            margin-right: 0.4em; vertical-align: -0.08em; }

/* ===== Blockquote ===== */
blockquote { border-left: 3px solid #b5a481; margin: 1em 0; padding: 0.2em 1em;
             color: #5c574c; background: #faf8f3; max-width: 100%; }

/* ===== References (GB/T 7714 style, hanging indent) ===== */
ol.references { list-style: none; padding: 0; font-size: 8.8pt; line-height: 1.65; }
ol.references li { padding-left: 3.2em; text-indent: -3.2em; margin: 0.45em 0; page-break-inside: avoid; }
.refnum { color: #8c5a3c; font-weight: 700; }
a.url { color: #4a463d; text-decoration: none; word-break: break-all; }

/* ===== Overflow guards ===== */
pre, table, figure, img, svg, blockquote { max-width: 100%; box-sizing: border-box; }
a { word-break: break-all; }
"""

doc = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>{CSS}</style>
</head>
<body>
{cover_html}
{toc_html}
{html_body}
</body>
</html>
"""

import os
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(doc)
print("written", OUT, len(doc), "chars;", len(footnotes), "footnotes")
# sanity checks
missing = [fid for fid in footnotes if f'id="ref-{fid}"' not in doc]
print("missing ref ids:", missing)
print("cite links:", len(re.findall(r'class="cite"', doc)))
