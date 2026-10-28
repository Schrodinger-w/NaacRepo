# Draws the low-fidelity wireframes for Interface-Design.md (Lab Assignment 7, Task 3A).
#
# Why a script instead of a drawing tool: the wireframes stay consistent with each other, and
# anyone on the team can change a label or a message and regenerate every sheet in one step.
#
#   python generate-wireframes.py
#
# Needs only Pillow:  pip install pillow
# Output: ./interfaces/*.png
#
# Team T095, CS314 Software Development Laboratory.

import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "interfaces")

# ---------------------------------------------------------------- layout and style

SHEET_W = 1480            # whole sheet
SCREEN_X, SCREEN_W = 40, 980   # the drawn "screen"
NOTE_X = SCREEN_X + SCREEN_W + 32
NOTE_W = SHEET_W - NOTE_X - 36

# Deliberately almost greyscale: these are low-fidelity wireframes, not visual designs.
# Colour is used only where the screen's meaning depends on it (status, errors, annotations).
INK = (38, 42, 50)
MUTED = (112, 120, 132)
LINE = (158, 164, 172)
HAIR = (214, 218, 224)
FILL = (244, 245, 248)
BAR = (228, 231, 236)
DARK = (64, 70, 82)          # primary button / header band
ERR = (170, 20, 36)
ERR_BG = (252, 236, 238)
OK = (24, 94, 50)
OK_BG = (235, 246, 238)
WARN = (122, 79, 0)
WARN_BG = (255, 246, 222)
INFO = (28, 74, 148)
INFO_BG = (235, 242, 253)
NOTE_C = (28, 74, 148)

_F = "C:/Windows/Fonts/"


def _font(name, size):
    return ImageFont.truetype(_F + name, size)


F_ID = _font("seguisb.ttf", 15)
F_TITLE = _font("seguisb.ttf", 25)
F_SUB = _font("segoeui.ttf", 15)
F_H = _font("seguisb.ttf", 17)
F_H2 = _font("seguisb.ttf", 14)
F_B = _font("segoeui.ttf", 14)
F_BB = _font("seguisb.ttf", 14)
F_S = _font("segoeui.ttf", 12)
F_SB = _font("seguisb.ttf", 12)
F_MONO = _font("consola.ttf", 12)


class Sheet:
    """One wireframe sheet: a title band, the screen drawing, and a numbered note column."""

    def __init__(self, ident, name, use_case, height):
        self.img = Image.new("RGB", (SHEET_W, height), "white")
        self.d = ImageDraw.Draw(self.img)
        self.ident = ident
        self.notes = []
        self._note_n = 0

        d = self.d
        d.rectangle([0, 0, SHEET_W, 62], fill=DARK)
        d.text((SCREEN_X, 16), ident, font=F_ID, fill=(190, 198, 212))
        d.text((SCREEN_X, 32), name, font=F_TITLE, fill="white")
        d.text((SHEET_W - 36, 24), use_case, font=F_SUB, fill=(206, 214, 228), anchor="ra")
        d.line([0, 62, SHEET_W, 62], fill=(30, 34, 42))
        d.text((NOTE_X, 86), "NOTES", font=F_SB, fill=MUTED)
        d.line([NOTE_X, 104, NOTE_X + NOTE_W, 104], fill=HAIR)

    # ---- helpers -------------------------------------------------------------

    def wrap(self, text, font, width):
        out, line = [], ""
        for word in text.split():
            trial = (line + " " + word).strip()
            if self.d.textlength(trial, font=font) <= width:
                line = trial
            else:
                if line:
                    out.append(line)
                line = word
        if line:
            out.append(line)
        return out

    def para(self, x, y, text, font=F_B, fill=INK, width=None, leading=4):
        width = width or SCREEN_W
        for ln in self.wrap(text, font, width):
            self.d.text((x, y), ln, font=font, fill=fill)
            y += font.size + leading
        return y

    def note(self, text, at=None):
        """Adds a numbered note; `at` places the matching marker on the screen."""
        self._note_n += 1
        n = self._note_n
        self.notes.append((n, text))
        if at:
            self.marker(n, *at)
        return n

    def marker(self, n, x, y, r=11):
        self.d.ellipse([x - r, y - r, x + r, y + r], fill=NOTE_C)
        self.d.text((x, y - 1), str(n), font=F_SB, fill="white", anchor="mm")

    def draw_notes(self, y=116):
        for n, text in self.notes:
            self.marker(n, NOTE_X + 11, y + 8)
            yy = y
            for ln in self.wrap(text, F_S, NOTE_W - 32):
                self.d.text((NOTE_X + 30, yy), ln, font=F_S, fill=INK)
                yy += 16
            y = yy + 10
        return y

    def save(self, filename):
        self.draw_notes()
        path = os.path.join(OUT_DIR, filename)
        self.img.save(path)
        print("  wrote", filename, f"({self.img.width}x{self.img.height})")


# ---------------------------------------------------------------- widgets

def screen(sh, x, y, w, h, label=None):
    """The outline that stands for one browser window / screen."""
    sh.d.rectangle([x, y, x + w, y + h], fill="white", outline=LINE, width=2)
    if label:
        sh.d.text((x + 2, y - 19), label, font=F_SB, fill=MUTED)
    return x, y, w, h


def header_bar(sh, x, y, w, user, role):
    sh.d.rectangle([x, y, x + w, y + 46], fill=DARK)
    sh.d.rectangle([x + 12, y + 10, x + 38, y + 36], fill="white")
    sh.d.text((x + 25, y + 23), "N", font=F_BB, fill=DARK, anchor="mm")
    sh.d.text((x + 48, y + 9), "NAAC Evidence Repository", font=F_BB, fill="white")
    sh.d.text((x + 48, y + 26), "Prototype  ·  CS314", font=F_S, fill=(186, 194, 208))
    sh.d.text((x + w - 104, y + 9), user, font=F_SB, fill="white", anchor="ra")
    sh.d.text((x + w - 104, y + 26), role, font=F_S, fill=(186, 194, 208), anchor="ra")
    sh.d.rounded_rectangle([x + w - 96, y + 11, x + w - 12, y + 35], 4, outline=(170, 180, 196))
    sh.d.text((x + w - 54, y + 23), "Sign out", font=F_SB, fill="white", anchor="mm")
    return y + 46


def sidebar(sh, x, y, w, h, items, active):
    sh.d.rectangle([x, y, x + w, y + h], fill=(250, 251, 252), outline=HAIR)
    yy = y + 12
    for it in items:
        if it == active:
            sh.d.rectangle([x + 6, yy - 4, x + w - 6, yy + 22], fill=BAR)
            sh.d.rectangle([x + 6, yy - 4, x + 9, yy + 22], fill=DARK)
        sh.d.text((x + 16, yy), it, font=F_BB if it == active else F_B, fill=INK)
        yy += 32
    return yy


def field(sh, x, y, w, label, value="", required=False, kind="text",
          hint=None, error=None, h=34, disabled=False):
    lab = label + (" *" if required else "")
    sh.d.text((x, y), lab, font=F_BB, fill=INK)
    if required:
        sh.d.text((x + sh.d.textlength(label + " ", font=F_BB), y), "*", font=F_BB, fill=ERR)
    y += 20
    if kind == "textarea":
        h = 76
    box_fill = BAR if disabled else "white"
    outline = ERR if error else LINE
    sh.d.rectangle([x, y, x + w, y + h], fill=box_fill, outline=outline)
    if kind == "password":
        shown = "\u2022" * 9
    elif kind == "file":
        sh.d.rounded_rectangle([x + 6, y + 5, x + 104, y + h - 5], 3, fill=BAR, outline=LINE)
        sh.d.text((x + 55, y + h / 2), "Choose file", font=F_S, fill=INK, anchor="mm")
        shown = value or "No file chosen"
        sh.d.text((x + 116, y + h / 2), shown, font=F_B,
                  fill=INK if value else MUTED, anchor="lm")
        shown = None
    else:
        shown = value
    if shown is not None:
        sh.d.text((x + 10, y + h / 2), shown, font=F_B,
                  fill=MUTED if (not value and kind != "password") else INK, anchor="lm")
    if kind == "select":
        sh.d.polygon([(x + w - 22, y + h / 2 - 3), (x + w - 12, y + h / 2 - 3),
                      (x + w - 17, y + h / 2 + 4)], fill=MUTED)
    y += h + 5
    if hint:
        y = sh.para(x, y, hint, F_S, MUTED, w)
    if error:
        sh.d.text((x, y), error, font=F_SB, fill=ERR)
        y += 18
    return y + 10


def static_value(sh, x, y, w, label, value, hint=None):
    sh.d.text((x, y), label, font=F_BB, fill=INK)
    y += 20
    sh.d.text((x, y), value, font=F_B, fill=INK)
    y += 22
    if hint:
        y = sh.para(x, y, hint, F_S, MUTED, w)
    return y + 10


def button(sh, x, y, label, kind="primary", w=None, h=34, font=F_BB):
    w = w or int(sh.d.textlength(label, font=font)) + 36
    if kind == "primary":
        sh.d.rounded_rectangle([x, y, x + w, y + h], 4, fill=DARK)
        sh.d.text((x + w / 2, y + h / 2), label, font=font, fill="white", anchor="mm")
    elif kind == "danger":
        sh.d.rounded_rectangle([x, y, x + w, y + h], 4, fill=ERR)
        sh.d.text((x + w / 2, y + h / 2), label, font=font, fill="white", anchor="mm")
    elif kind == "link":
        sh.d.text((x, y + h / 2), label, font=font, fill=INFO, anchor="lm")
        tw = sh.d.textlength(label, font=font)
        sh.d.line([x, y + h / 2 + 9, x + tw, y + h / 2 + 9], fill=INFO)
        w = int(tw)
    else:  # secondary
        sh.d.rounded_rectangle([x, y, x + w, y + h], 4, fill="white", outline=LINE)
        sh.d.text((x + w / 2, y + h / 2), label, font=font, fill=INK, anchor="mm")
    return x + w + 12


BADGES = {
    "Draft": (BAR, (62, 70, 82)),
    "Pending review": (WARN_BG, WARN),
    "Approved": (OK_BG, OK),
    "Needs revision": (ERR_BG, ERR),
    "Current": (BAR, (62, 70, 82)),
}


def badge(sh, x, y, text, font=F_SB):
    bg, fg = BADGES.get(text, (BAR, INK))
    w = int(sh.d.textlength(text, font=font)) + 18
    sh.d.rounded_rectangle([x, y, x + w, y + 21], 10, fill=bg, outline=fg)
    sh.d.text((x + w / 2, y + 10), text, font=font, fill=fg, anchor="mm")
    return x + w + 8


def banner(sh, x, y, w, text, kind="error", bold_lead=None):
    bg, fg = {"error": (ERR_BG, ERR), "ok": (OK_BG, OK),
              "info": (INFO_BG, INFO), "warn": (WARN_BG, WARN)}[kind]
    lines = sh.wrap((bold_lead + " " if bold_lead else "") + text, F_B, w - 28)
    h = 14 + len(lines) * 19
    sh.d.rectangle([x, y, x + w, y + h], fill=bg, outline=fg)
    yy = y + 8
    for i, ln in enumerate(lines):
        if i == 0 and bold_lead:
            sh.d.text((x + 14, yy), bold_lead, font=F_BB, fill=fg)
            rest = ln[len(bold_lead):].lstrip()
            sh.d.text((x + 14 + sh.d.textlength(bold_lead + " ", font=F_BB), yy),
                      rest, font=F_B, fill=fg)
        else:
            sh.d.text((x + 14, yy), ln, font=F_B, fill=fg)
        yy += 19
    return y + h + 14


def table(sh, x, y, w, headers, widths, rows, row_h=34):
    sh.d.rectangle([x, y, x + w, y + 30], fill=FILL, outline=HAIR)
    cx = x
    for head, cw in zip(headers, widths):
        sh.d.text((cx + 10, y + 8), head, font=F_SB, fill=INK)
        cx += cw
    y += 30
    for row in rows:
        sh.d.rectangle([x, y, x + w, y + row_h], fill="white", outline=HAIR)
        cx = x
        for cell, cw in zip(row, widths):
            if cell in BADGES:
                badge(sh, cx + 10, y + (row_h - 21) / 2, cell)
            elif isinstance(cell, tuple) and cell[0] == "btn":
                button(sh, cx + 10, y + 5, cell[1], "primary", h=row_h - 10, font=F_SB)
            elif isinstance(cell, tuple) and cell[0] == "link":
                t = cell[1]
                sh.d.text((cx + 10, y + row_h / 2), t, font=F_B, fill=INFO, anchor="lm")
                sh.d.line([cx + 10, y + row_h / 2 + 9,
                           cx + 10 + sh.d.textlength(t, font=F_B), y + row_h / 2 + 9], fill=INFO)
            else:
                sh.d.text((cx + 10, y + row_h / 2), str(cell), font=F_S, fill=INK, anchor="lm")
            cx += cw
        y += row_h
    return y + 14


def card(sh, x, y, w, h, title):
    sh.d.rectangle([x, y, x + w, y + h], fill="white", outline=HAIR)
    sh.d.text((x + 14, y + 12), title, font=F_H2, fill=INK)
    sh.d.line([x + 14, y + 34, x + w - 14, y + 34], fill=HAIR)
    return y + 44


def dl(sh, x, y, w, pairs, gap=26):
    for k, v in pairs:
        sh.d.text((x, y), k, font=F_S, fill=MUTED)
        sh.d.text((x + 128, y), v, font=F_S, fill=INK)
        y += gap
    return y


def tile(sh, x, y, w, h, value, label):
    sh.d.rectangle([x, y, x + w, y + h], fill="white", outline=HAIR)
    sh.d.text((x + 14, y + 12), value, font=_font("seguisb.ttf", 24), fill=INK)
    if label in BADGES:
        badge(sh, x + 14, y + h - 32, label)
    else:
        sh.d.text((x + 14, y + h - 30), label, font=F_S, fill=MUTED)


def modal(sh, x, y, w, h, title):
    sh.d.rectangle([x - 6, y - 6, x + w + 6, y + h + 6], fill=(236, 238, 242))
    sh.d.rectangle([x, y, x + w, y + h], fill="white", outline=LINE, width=2)
    sh.d.text((x + 20, y + 18), title, font=F_H, fill=INK)
    return y + 54


def page_header(sh, x, y, w, title, desc=None, actions=()):
    sh.d.text((x, y), title, font=F_H, fill=INK)
    ax = x + w
    for label, kind in reversed(actions):
        bw = int(sh.d.textlength(label, font=F_BB)) + 36
        button(sh, ax - bw, y - 6, label, kind, w=bw)
        ax -= bw + 10
    y += 26
    if desc:
        y = sh.para(x, y, desc, F_S, MUTED, w - 240)
    return y + 12


def file_preview(sh, x, y, w, h):
    sh.d.rectangle([x, y, x + w, y + h], fill=(62, 66, 72), outline=LINE)
    sh.d.rectangle([x + 40, y + 16, x + w - 40, y + h - 16], fill=(252, 252, 252))
    for i, t in enumerate(["Workshop on Research Methodology and IPR",
                           "Department of CSE  ·  August 2025",
                           "Outcome report"]):
        sh.d.text((x + 62, y + 46 + i * 20), t, font=F_S, fill=(70, 76, 86))
    sh.d.text((x + w / 2, y + h - 30), "[ in-browser PDF / image preview ]",
              font=F_S, fill=MUTED, anchor="mm")
    return y + h + 10


def arrow(sh, x1, y1, x2, y2, label=None, dashed=False, colour=NOTE_C):
    d = sh.d
    if dashed:
        total = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
        steps = max(int(total / 9), 1)
        for i in range(steps):
            if i % 2:
                continue
            a = i / steps
            b = min((i + 1) / steps, 1)
            d.line([x1 + (x2 - x1) * a, y1 + (y2 - y1) * a,
                    x1 + (x2 - x1) * b, y1 + (y2 - y1) * b], fill=colour, width=2)
    else:
        d.line([x1, y1, x2, y2], fill=colour, width=2)
    ang = 0.5
    import math
    th = math.atan2(y2 - y1, x2 - x1)
    for s in (-ang, ang):
        d.line([x2, y2, x2 - 11 * math.cos(th + s), y2 - 11 * math.sin(th + s)],
               fill=colour, width=2)
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        tw = d.textlength(label, font=F_S)
        d.rectangle([mx - tw / 2 - 5, my - 10, mx + tw / 2 + 5, my + 9], fill="white")
        d.text((mx, my), label, font=F_S, fill=colour, anchor="mm")


# ---------------------------------------------------------------- sheets

NAV_FACULTY = ["My evidence", "Upload evidence", "Search evidence", "My profile"]
NAV_COORD = ["Review queue", "Search evidence", "My profile"]
NAV_IQAC = ["Dashboard", "Search evidence", "My profile"]
NAV_ADMIN = ["Users", "Audit log", "Criteria and sub-metrics", "Search evidence", "My profile"]


def wf01_sign_in():
    sh = Sheet("UI-WF-01", "Sign In", "Precondition for UC-004, UC-011, UC-016", 690)
    # State A
    x, y, w, h = SCREEN_X, 116, 470, 330
    screen(sh, x, y, w, h, "State A — initial")
    cx, cy, cw = x + 60, y + 36, w - 120
    sh.d.rectangle([cx, cy, cx + cw, cy + 64], fill=DARK)
    sh.d.text((cx + 18, cy + 14), "Sign in", font=F_H, fill="white")
    sh.d.text((cx + 18, cy + 38), "NAAC Evidence Repository", font=F_S, fill=(196, 204, 218))
    fy = cy + 84
    fy = field(sh, cx, fy, cw, "Email address", "", required=True)
    fy = field(sh, cx, fy, cw, "Password", "", required=True, kind="password")
    button(sh, cx, fy, "Sign in", "primary", w=cw)
    sh.d.text((cx + cw / 2, fy + 52), "Forgot your password? Contact the system administrator.",
              font=F_S, fill=MUTED, anchor="mm")

    # State B
    x2 = x + w + 40
    screen(sh, x2, y, w, h, "State B — sign-in refused")
    cx2 = x2 + 60
    sh.d.rectangle([cx2, cy, cx2 + cw, cy + 64], fill=DARK)
    sh.d.text((cx2 + 18, cy + 14), "Sign in", font=F_H, fill="white")
    sh.d.text((cx2 + 18, cy + 38), "NAAC Evidence Repository", font=F_S, fill=(196, 204, 218))
    fy2 = banner(sh, cx2, cy + 80, cw, "Invalid email or password.", "error")
    fy2 = field(sh, cx2, fy2, cw, "Email address", "a.rao@lnmiit.ac.in", required=True)
    fy2 = field(sh, cx2, fy2, cw, "Password", "", required=True, kind="password")
    button(sh, cx2, fy2, "Sign in", "primary", w=cw)

    sh.note("FR-001: the user signs in with institutional email and password. Both fields are "
            "required; empty fields are reported before any request is sent.", (x + 60 + 430, 232))
    sh.note("FR-002: a wrong password and an unknown email produce the SAME message, so the screen "
            "never reveals whether an account exists.", (x2 + 60 + 430, 206))
    sh.note("Rate limit: after 5 failed attempts for the same email the banner instead reads "
            "\"Too many failed sign-in attempts. Try again in 15 minute(s).\" (HTTP 429).")
    sh.note("On success the user is sent to the landing page for their role: Faculty -> My evidence, "
            "Coordinator -> Review queue, IQAC Lead -> Dashboard, Admin -> Users.")
    sh.note("FR-007: after 30 minutes without activity the next action returns to this screen with "
            "the notice \"You were signed out after a period of inactivity. Please sign in again.\"")
    sh.save("UI-Wireframe-01-Sign-In.png")


def wf02_shell():
    sh = Sheet("UI-WF-02", "Application Shell and Role-Based Navigation",
               "Frame shared by UC-004, UC-011, UC-016", 700)
    x, y, w = SCREEN_X, 126, SCREEN_W
    screen(sh, x, y, w, 300, "Signed-in frame")
    cy = header_bar(sh, x + 2, y + 2, w - 4, "Dr. Ananya Rao", "Faculty · CSE")
    sidebar(sh, x + 2, cy, 200, 300 - 48, NAV_FACULTY, "My evidence")
    sh.d.rectangle([x + 214, cy + 14, x + w - 16, y + 286], fill=FILL, outline=HAIR)
    sh.d.text((x + 214 + (w - 230) / 2, cy + 140), "page content  ( UI-WF-03 … UI-WF-12 )",
              font=F_B, fill=MUTED, anchor="mm")

    sh.d.text((x, 462), "Sidebar per role (FR-008)", font=F_H2, fill=INK)
    bx = x
    for title, items, active in [("Faculty", NAV_FACULTY, "My evidence"),
                                 ("Department Coordinator", NAV_COORD, "Review queue"),
                                 ("IQAC Lead", NAV_IQAC, "Dashboard"),
                                 ("System Administrator", NAV_ADMIN, "Users")]:
        sh.d.text((bx, 486), title, font=F_SB, fill=MUTED)
        sidebar(sh, bx, 506, 228, 176, items, active)
        bx += 244

    sh.note("Header: product name on the left; signed-in person, role and department on the right, "
            "with Sign out. Sign out ends the session on the server (FR-003).", (x + 560, y + 26))
    sh.note("FR-008: the sidebar lists only the pages the role may use. Hiding a link is a "
            "convenience; every API route repeats the check, so typing an address directly is "
            "still refused with 403.", (x + 110, cy + 150))
    sh.note("Every screen in this document appears inside this frame, except Sign In (UI-WF-01), "
            "which has no header or sidebar.")
    sh.note("\"Search evidence\" and \"My profile\" are available to all four roles; UC-016 is "
            "therefore reachable from every role's navigation.")
    sh.save("UI-Wireframe-02-App-Shell-Navigation.png")


def wf03_my_evidence():
    sh = Sheet("UI-WF-03", "My Evidence (faculty landing page)",
               "UC-004 entry point · UC-009 · FR-022", 740)
    x, y, w = SCREEN_X, 126, SCREEN_W
    screen(sh, x, y, w, 560)
    cy = header_bar(sh, x + 2, y + 2, w - 4, "Dr. Ananya Rao", "Faculty · CSE")
    sidebar(sh, x + 2, cy, 200, 558 - 48, NAV_FACULTY, "My evidence")
    px, pw = x + 226, w - 250
    py = page_header(sh, px, cy + 18, pw, "My evidence",
                     "Everything you have uploaded. Drafts are visible only to you.",
                     [("Upload evidence", "primary")])

    sh.d.rectangle([px, py, px + pw, py + 92], fill=ERR_BG, outline=ERR)
    sh.d.text((px + 14, py + 10), "Needs your attention (1)", font=F_H2, fill=ERR)
    sh.d.text((px + 14, py + 34), "Workshop on Research Methodology and IPR", font=F_B, fill=INFO)
    sh.para(px + 14, py + 54, "Feedback: The attendance sheet is missing for day 2.", F_S, INK, pw - 200)
    button(sh, px + pw - 170, py + 52, "Revise and resubmit", "primary", h=28, font=F_SB)
    py += 108

    table(sh, px, py, pw,
          ["Title", "Criterion", "Sub-metric", "Year", "Status", "Version", "Last updated"],
          [196, 128, 96, 76, 128, 76, 0],
          [[("link", "Workshop on Research…"), "3. Research, Innov…", "3.2.1", "2025-26",
            "Needs revision", "v1.0", "22 Oct 2026, 5:49 pm"],
           [("link", "Green campus drive"), "7. Institutional Val…", "7.1.2", "2024-25",
            "Approved", "v1.0", "22 Oct 2026, 5:52 pm"],
           [("link", "Enrolment register 2025"), "2. Teaching-Learn…", "2.1.1", "2025-26",
            "Pending review", "v1.0", "21 Oct 2026, 3:10 pm"],
           [("link", "Seminar photographs"), "—", "—", "—",
            "Draft", "Not submitted", "20 Oct 2026, 11:02 am"]])

    sh.note("Entry point for UC-004: \"Upload evidence\" opens UI-WF-04.", (px + pw - 78, cy + 26))
    sh.note("FR-030: every status is shown as a badge with a TEXT label as well as a colour, so the "
            "status never depends on colour alone.", (px + 650, py + 112))
    sh.note("US-004 / AC-06 of US-006: anything a coordinator sent back is repeated at the top with "
            "its feedback, so the faculty member cannot miss it. The button starts UC-012.",
            (px + 300, py - 56))
    sh.note("FR-018: drafts appear only in this list, only for their author, and have no version "
            "number until they are submitted.")
    sh.note("Clicking a title opens the evidence detail screen (UI-WF-06).")
    sh.note("Empty state, when nothing has been uploaded: \"You have not uploaded any evidence yet.\" "
            "with an Upload evidence button.")
    sh.save("UI-Wireframe-03-My-Evidence.png")


def wf04_upload():
    sh = Sheet("UI-WF-04", "Upload Evidence — form", "UC-004 main flow · FR-009 to FR-017", 900)
    x, y, w = SCREEN_X, 126, SCREEN_W
    screen(sh, x, y, w, 716)
    cy = header_bar(sh, x + 2, y + 2, w - 4, "Dr. Ananya Rao", "Faculty · CSE")
    sidebar(sh, x + 2, cy, 200, 714 - 48, NAV_FACULTY, "Upload evidence")
    px, pw = x + 226, w - 250
    py = page_header(sh, px, cy + 18, pw, "Upload evidence",
                     "Tag the file with its NAAC criterion, sub-metric and academic year. "
                     "Your department is added automatically.")
    py = sh.para(px, py, "Fields marked * are needed to submit for review. A draft only needs a title.",
                 F_S, MUTED, pw) + 10

    col = (pw - 30) // 2
    py = field(sh, px, py, pw, "Title", "", required=True)
    py = field(sh, px, py, pw, "Description", "", kind="textarea",
               hint="Optional: a short summary of what this evidence shows.")
    row = py
    ry = field(sh, px, row, col, "NAAC criterion", "Choose a criterion", required=True, kind="select")
    ry2 = field(sh, px + col + 30, row, col, "Sub-metric", "—", required=True, kind="select",
                hint="Choose a criterion first.", disabled=True)
    row = max(ry, ry2)
    ry = field(sh, px, row, col, "Academic year", "Choose a year", required=True, kind="select")
    ry2 = static_value(sh, px + col + 30, row, col, "Department",
                       "Computer Science and Engineering (CSE)",
                       "Filled in automatically from your account.")
    py = max(ry, ry2)
    py = field(sh, px, py, pw, "Evidence file", "", required=True, kind="file",
               hint="PDF, PNG or JPG, up to 10 MB.")
    bx = button(sh, px, py, "Submit for review", "primary")
    bx = button(sh, bx, py, "Save as draft", "secondary")
    button(sh, bx, py, "Cancel", "link")

    sh.note("FR-012 / AC-04: the title is the only field a DRAFT needs. Everything marked * is "
            "required before the record may be submitted (AC-05 to AC-07).", (px + pw - 40, py - 470))
    sh.note("FR-015 / AC-06: the sub-metric list is disabled until a criterion is chosen, and then "
            "offers only that criterion's sub-metrics. Changing the criterion clears a sub-metric "
            "that no longer belongs to it.", (px + col + 30 + col - 20, row - 86))
    sh.note("FR-017 / AC-08: the department is displayed, not editable. It is taken from the signed-in "
            "account on the server and a department sent in the request body is ignored.",
            (px + col + 30, row + 28))
    sh.note("FR-009 to FR-011: the file picker offers only .pdf/.png/.jpg/.jpeg, and type and size "
            "are checked as soon as a file is chosen (see UI-WF-05).", (px + 150, py - 52))
    sh.note("FR-018 / FR-021: \"Save as draft\" keeps the record private; \"Submit for review\" "
            "validates every mandatory field, sets the status to Pending Review and records v1.0.",
            (px + 108, py + 17))
    sh.note("Pressing Enter inside the form saves a DRAFT, never submits, so nothing reaches the "
            "coordinator by accident.")
    sh.note("The same form, prefilled, serves UC-006 (edit draft) and UC-012 (revise and resubmit); "
            "for a resubmission the single action is \"Resubmit for review\".")
    sh.save("UI-Wireframe-04-Upload-Evidence.png")


def wf05_upload_errors():
    sh = Sheet("UI-WF-05", "Upload Evidence — validation and error states",
               "UC-004 alternative flows · AC-02, AC-03, AC-06", 940)
    x, y, w = SCREEN_X, 126, 640
    screen(sh, x, y, w, 756, "Submit attempted with an incomplete form")
    px, pw = x + 24, w - 48
    py = y + 22
    sh.d.text((px, py), "Upload evidence", font=F_H, fill=INK)
    py += 34
    py = banner(sh, px, py, pw, "Complete the highlighted fields before submitting.", "error")
    py = field(sh, px, py, pw, "Title", "", required=True, error="Enter a title.")
    col = (pw - 24) // 2
    row = py
    ry = field(sh, px, row, col, "NAAC criterion", "Choose a criterion", required=True,
               kind="select", error="Choose a NAAC criterion.")
    ry2 = field(sh, px + col + 24, row, col, "Sub-metric", "—", required=True, kind="select",
                error="Choose a sub-metric.", disabled=True)
    py = max(ry, ry2)
    py = field(sh, px, py, col, "Academic year", "Choose a year", required=True, kind="select",
               error="Choose an academic year.")
    py = field(sh, px, py, pw, "Evidence file", "minutes.docx", required=True, kind="file",
               error="Only PDF, PNG or JPG files are allowed.")
    button(sh, px, py, "Submit for review", "primary")

    # Message catalogue
    mx, mw = x + w + 40, SCREEN_W + SCREEN_X - (x + w + 40) + 120
    sh.d.text((mx, y - 19), "Messages for the exceptional flows", font=F_SB, fill=MUTED)
    sh.d.rectangle([mx, y, mx + mw, y + 756], fill=FILL, outline=HAIR)
    my = y + 18
    rows = [
        ("File type not allowed", "AC-02", "Only PDF, PNG or JPG files are allowed.",
         "Checked in the browser when the file is chosen, and again on the server by extension and MIME type."),
        ("File too large", "AC-03", "The file is larger than 10 MB.",
         "The upload is stopped while it streams; no partial file is kept."),
        ("Disguised file", "FR-010", "This file is not a genuine PDF, PNG or JPG. Please check the file and try again.",
         "The server reads the first bytes, so a .docx renamed to .pdf is refused."),
        ("Mandatory field missing", "UC-004", "Complete the highlighted fields before submitting.",
         "Every missing field is listed at once, each next to its own field."),
        ("Sub-metric / criterion mismatch", "AC-06", "This sub-metric does not belong to the chosen criterion.",
         "Enforced on the server even though the UI filters the list."),
        ("Title too long", "—", "Keep the title under 200 characters.", ""),
        ("Server unreachable", "NFR-009", "Cannot reach the server. Check that the app is still running.",
         "Shown instead of a blank screen when the API cannot be contacted."),
    ]
    for name, req, msg, extra in rows:
        sh.d.text((mx + 14, my), name, font=F_SB, fill=INK)
        sh.d.text((mx + mw - 14, my), req, font=F_S, fill=MUTED, anchor="ra")
        my += 19
        for ln in sh.wrap('"' + msg + '"', F_S, mw - 34):
            sh.d.text((mx + 14, my), ln, font=F_S, fill=ERR)
            my += 16
        if extra:
            for ln in sh.wrap(extra, F_S, mw - 34):
                sh.d.text((mx + 14, my), ln, font=F_S, fill=MUTED)
                my += 16
        my += 10
        sh.d.line([mx + 14, my - 6, mx + mw - 14, my - 6], fill=HAIR)

    sh.note("Each message appears next to the field it belongs to and is linked to it for screen "
            "readers; the banner at the top repeats that something must be corrected.")
    sh.note("Nothing is saved while any field is invalid: the record is created only after the "
            "server has accepted every field.")
    sh.note("The same checks run on the server. The browser checks only give a faster answer; the "
            "server's decision is the one that counts (NFR-004 to NFR-006).")
    sh.note("A file refused after it was stored is deleted again, so a failed upload never leaves a "
            "file behind.")
    sh.save("UI-Wireframe-05-Upload-Validation-Errors.png")


def wf06_detail():
    sh = Sheet("UI-WF-06", "Evidence Detail — draft saved / submitted",
               "UC-004 post-condition · AC-09, AC-10 · FR-032", 900)
    x, y, w = SCREEN_X, 126, SCREEN_W
    screen(sh, x, y, w, 716)
    cy = header_bar(sh, x + 2, y + 2, w - 4, "Dr. Ananya Rao", "Faculty · CSE")
    sidebar(sh, x + 2, cy, 200, 714 - 48, NAV_FACULTY, "My evidence")
    px, pw = x + 226, w - 250

    # toast
    sh.d.rectangle([x + w - 320, cy + 10, x + w - 16, cy + 56], fill="white", outline=OK)
    sh.d.rectangle([x + w - 320, cy + 10, x + w - 316, cy + 56], fill=OK)
    sh.d.text((x + w - 304, cy + 26), "Evidence submitted for review.", font=F_B, fill=INK)
    sh.d.text((x + w - 32, cy + 26), "\u00d7", font=F_B, fill=MUTED)

    py = page_header(sh, px, cy + 70, pw, "Workshop on Research Methodology and IPR")
    bx = badge(sh, px, py, "Pending review")
    sh.d.text((bx, py + 3), "v1.0", font=F_B, fill=INK)
    py += 34
    py = banner(sh, px, py, pw, "Waiting for review by the department coordinator. It cannot be "
                "edited while it is being reviewed.", "warn")

    cw = (pw - 20) // 2
    ch = 234
    dy = card(sh, px, py, cw, ch, "Details")
    dl(sh, px + 14, dy, cw, [("Criterion", "3. Research, Innovations…"),
                             ("Sub-metric", "3.2.1 Workshops on resea…"),
                             ("Academic year", "2025-26"),
                             ("Department", "Computer Science (CSE)"),
                             ("Uploaded by", "Dr. Ananya Rao"),
                             ("Created", "22 Oct 2026, 5:46 pm")])
    fy = card(sh, px + cw + 20, py, cw, ch, "File")
    file_preview(sh, px + cw + 34, fy, cw - 28, 118)
    sh.d.text((px + cw + 34, fy + 128), "IPR_Workshop_Report.pdf  ·  707 bytes", font=F_S, fill=INK)
    sh.d.text((px + cw + 34, fy + 148), "Open in a new tab     Download", font=F_S, fill=INFO)
    py += ch + 16

    hy = card(sh, px, py, pw, 150, "Version history")
    sh.d.line([px + 18, hy, px + 18, hy + 94], fill=DARK, width=3)
    sh.d.text((px + 32, hy - 2), "v1.0  uploaded by Dr. Ananya Rao", font=F_SB, fill=INK)
    badge(sh, px + 266, hy - 4, "Current")
    sh.d.text((px + 32, hy + 18), "22 Oct 2026, 5:48 pm", font=F_S, fill=MUTED)
    sh.d.text((px + 32, hy + 38), "IPR_Workshop_Report.pdf  ·  707 bytes      Download",
              font=F_S, fill=INK)

    sh.note("AC-10: a confirmation message appears after a successful save or submission. It "
            "disappears by itself and can be dismissed.", (x + w - 330, cy + 33))
    sh.note("AC-09: the status becomes \"Pending Review\" and the record is given version v1.0.",
            (px + 112, py - 404))
    sh.note("The buttons shown depend on the status and on who is looking: a DRAFT shows Edit draft, "
            "Submit for review and Delete draft; a PENDING record shows none of them (FR-019, FR-020); "
            "an APPROVED record is locked (BR-004).", (px + pw - 30, py - 452))
    sh.note("FR-024: the file is previewed in the page. If the preview cannot be displayed, the "
            "Download link is the fallback.", (px + cw + 34 + cw - 60, py - 300))
    sh.note("FR-032: the version history lists every file version and every review decision in time "
            "order. It grows as the record moves through the workflow (see UI-WF-10).",
            (px + 420, hy + 36))
    sh.note("The same screen serves UC-011 for the coordinator and UC-016 for any permitted reader; "
            "only the action buttons differ.")
    sh.save("UI-Wireframe-06-Evidence-Detail-Draft.png")


def wf07_queue():
    sh = Sheet("UI-WF-07", "Review Queue", "UC-011 steps 1-2 · UC-010 · FR-023", 700)
    x, y, w = SCREEN_X, 126, SCREEN_W
    screen(sh, x, y, w, 520)
    cy = header_bar(sh, x + 2, y + 2, w - 4, "Dr. Vikram Mehta", "Department Coordinator · CSE")
    sidebar(sh, x + 2, cy, 200, 518 - 48, NAV_COORD, "Review queue")
    px, pw = x + 226, w - 250
    py = page_header(sh, px, cy + 18, pw, "Review queue",
                     "Submissions from Computer Science and Engineering (CSE), oldest first.",
                     [("Refresh", "secondary")])
    tw = (pw - 32) // 3
    for i, (val, lab) in enumerate([("3", "Pending review"), ("12", "Approved"), ("1", "Needs revision")]):
        tile(sh, px + i * (tw + 16), py, tw, 80, val, lab)
    py += 96
    table(sh, px, py, pw,
          ["Title", "Submitted by", "Criterion", "Sub-metric", "Year", "Version", "Waiting since", ""],
          [194, 118, 118, 74, 70, 60, 136, 0],
          [[("link", "Workshop on Research…"), "Dr. Ananya Rao", "3. Research…", "3.2.1",
            "2025-26", "v1.0", "22 Oct, 5:48 pm", ("btn", "Review")],
           [("link", "Enrolment register"), "Dr. S. Nair", "2. Teaching…", "2.1.1",
            "2025-26", "v1.0", "22 Oct, 2:10 pm", ("btn", "Review")],
           [("link", "Lab utilisation report"), "Dr. Ananya Rao", "4. Infrastructu…", "4.1.1",
            "2024-25", "v1.1", "21 Oct, 9:30 am", ("btn", "Review")]])

    sh.note("FR-023: the queue shows the submissions waiting for this coordinator's OWN department. "
            "Another department's work is never listed, and a coordinator of another department "
            "cannot open these records (403).", (px + 230, cy + 44))
    sh.note("Oldest first, so the longest-waiting submission is reviewed first. The list is read "
            "fresh on every visit; Refresh reloads it. It does not poll on a timer, because that "
            "would defeat the 30-minute inactivity timeout (FR-007).", (px + pw - 46, cy + 26))
    sh.note("Section 11.2 of the SRS: the three tiles give the department's totals per status.",
            (px + 60, py - 50))
    sh.note("\"Review\" or the title opens UI-WF-08.", (px + pw - 46, py + 64))
    sh.note("Empty state: \"Nothing is waiting for review.\" with the explanation that new "
            "submissions from the department will appear here.")
    sh.save("UI-Wireframe-07-Review-Queue.png")


def wf08_review():
    sh = Sheet("UI-WF-08", "Review Evidence — preview and decision",
               "UC-011 steps 3-6 · FR-024, AC-02", 840)
    x, y, w = SCREEN_X, 126, SCREEN_W
    screen(sh, x, y, w, 656)
    cy = header_bar(sh, x + 2, y + 2, w - 4, "Dr. Vikram Mehta", "Department Coordinator · CSE")
    sidebar(sh, x + 2, cy, 200, 654 - 48, NAV_COORD, "Review queue")
    px, pw = x + 226, w - 250
    py = page_header(sh, px, cy + 18, pw, "Workshop on Research Methodology and IPR",
                     actions=[("Approve", "primary"), ("Reject", "danger")])
    sh.d.text((px, py), "\u2190 Back to the review queue", font=F_S, fill=INFO)
    py += 26
    bx = badge(sh, px, py, "Pending review")
    sh.d.text((bx, py + 3), "v1.0", font=F_B, fill=INK)
    py += 32

    cw = (pw - 20) // 2
    ch = 350
    dy = card(sh, px, py, cw, ch, "Details")
    dl(sh, px + 14, dy, cw, [("Criterion", "3. Research, Innovations…"),
                             ("Sub-metric", "3.2.1 Workshops on rese…"),
                             ("Academic year", "2025-26"),
                             ("Department", "Computer Science (CSE)"),
                             ("Uploaded by", "Dr. Ananya Rao"),
                             ("Created", "22 Oct 2026, 5:46 pm"),
                             ("Last updated", "22 Oct 2026, 5:48 pm"),
                             ("Description", "Two-day workshop held in")])
    sh.d.text((px + 142, dy + 8 * 26), "August 2025.", font=F_S, fill=INK)
    fy = card(sh, px + cw + 20, py, cw, ch, "File")
    file_preview(sh, px + cw + 34, fy, cw - 28, 212)
    sh.d.text((px + cw + 34, fy + 222), "IPR_Workshop_Report.pdf  ·  707 bytes", font=F_S, fill=INK)
    sh.d.text((px + cw + 34, fy + 242), "Open in a new tab     Download", font=F_S, fill=INFO)
    sh.para(px + cw + 34, fy + 264,
            "If the preview does not appear, download the file to inspect it.", F_S, MUTED, cw - 40)

    sh.note("AC-01 of US-006: only a coordinator of this record's department sees Approve and "
            "Reject. For any other user the same screen is read-only.", (px + pw - 150, cy + 26))
    sh.note("FR-024 / AC-02: the uploaded file and its metadata are shown together, so the decision "
            "is made with both in view.", (px + cw + 34 + cw / 2, fy + 100))
    sh.note("UC-011 alternative flow: if the in-page preview fails to load, the coordinator "
            "downloads the file instead. The fallback is stated on the screen.",
            (px + cw + 34, fy + 246))
    sh.note("UC-011 alternative flow: if more information is needed, the coordinator simply leaves "
            "the screen; the record stays \"Pending review\" until revisited.")
    sh.note("Approve opens UI-WF-10, Reject opens UI-WF-09.")
    sh.note("The file is requested by evidence id, never by a file name or path, and the server "
            "checks permission again before sending a single byte.")
    sh.save("UI-Wireframe-08-Review-Evidence.png")


def wf09_reject():
    sh = Sheet("UI-WF-09", "Reject with mandatory feedback",
               "UC-011 alternative flow · FR-026, FR-027, BR-005, AC-04", 700)
    x, y, w = SCREEN_X, 126, 470
    screen(sh, x, y, w, 390, "State A — dialog opened")
    sh.d.rectangle([x + 2, y + 2, x + w - 2, y + 388], fill=(246, 247, 249))
    my = modal(sh, x + 30, y + 40, w - 60, 310, "Reject and send back for revision?")
    my = sh.para(x + 50, my, "The record goes back to the faculty member as \"Needs revision\". "
                 "Explain what is missing or incorrect.", F_S, INK, w - 100) + 10
    field(sh, x + 50, my, w - 100, "Feedback for the faculty member", "", required=True,
          kind="textarea")
    bxx = x + w - 48
    bw = 170
    button(sh, bxx - bw, y + 300, "Reject with feedback", "danger", w=bw)
    button(sh, bxx - bw - 92, y + 300, "Cancel", "secondary", w=80)

    x2 = x + w + 40
    screen(sh, x2, y, w, 390, "State B — submitted with an empty box")
    sh.d.rectangle([x2 + 2, y + 2, x2 + w - 2, y + 388], fill=(246, 247, 249))
    my2 = modal(sh, x2 + 30, y + 40, w - 60, 310, "Reject and send back for revision?")
    my2 = sh.para(x2 + 50, my2, "The record goes back to the faculty member as \"Needs revision\". "
                  "Explain what is missing or incorrect.", F_S, INK, w - 100) + 10
    field(sh, x2 + 50, my2, w - 100, "Feedback for the faculty member", "", required=True,
          kind="textarea", error="Enter feedback explaining what needs to change.")
    button(sh, x2 + w - 48 - bw, y + 300, "Reject with feedback", "danger", w=bw)
    button(sh, x2 + w - 48 - bw - 92, y + 300, "Cancel", "secondary", w=80)

    sh.note("FR-027 / BR-005 / AC-04: a rejection without a comment is blocked. The dialog stays "
            "open, the box is marked invalid and the status does not change.",
            (x2 + w - 70, y + 250))
    sh.note("The block is applied twice: the dialog refuses to send, and the server rejects an "
            "empty comment with HTTP 400 on POST /api/evidence/:id/reject.")
    sh.note("AC-05: once feedback is entered and the action confirmed, the status becomes "
            "\"Needs revision\" and the confirmation reads \"Evidence sent back to the faculty "
            "member for revision.\"")
    sh.note("AC-06: the feedback is stored with the record and is shown to the faculty member on "
            "UI-WF-03 and on the evidence detail screen.")
    sh.note("Keyboard: the dialog traps focus, Escape closes it, and the cursor starts in the "
            "feedback box.", (x + 60, y + 190))
    sh.note("The same dialog, with the wording changed, serves the IQAC lead's re-audit flag "
            "(FR-029), which also requires a written reason.")
    sh.save("UI-Wireframe-09-Reject-Dialog.png")


def wf10_approve():
    sh = Sheet("UI-WF-10", "Approve and lock",
               "UC-011 main flow · FR-025, BR-004, AC-03, AC-07", 780)
    x, y, w = SCREEN_X, 126, 470
    screen(sh, x, y, w, 300, "State A — confirmation dialog")
    sh.d.rectangle([x + 2, y + 2, x + w - 2, y + 298], fill=(246, 247, 249))
    my = modal(sh, x + 30, y + 24, w - 60, 250, "Approve this evidence?")
    my = sh.para(x + 50, my, "The record is marked \"Approved\" and locked: the faculty member can "
                 "no longer edit or delete it.", F_S, INK, w - 100) + 10
    field(sh, x + 50, my, w - 100, "Comment for the faculty member (optional)", "",
          kind="textarea")
    button(sh, x + w - 48 - 150, y + 224, "Approve and lock", "primary", w=150)
    button(sh, x + w - 48 - 150 - 92, y + 224, "Cancel", "secondary", w=80)

    x2 = x + w + 40
    screen(sh, x2, y, w, 300, "State B — result for every dashboard")
    sh.d.rectangle([x2 + 10, y + 10, x2 + w - 10, y + 56], fill="white", outline=OK)
    sh.d.rectangle([x2 + 10, y + 10, x2 + 14, y + 56], fill=OK)
    sh.d.text((x2 + 26, y + 26), "Evidence approved and locked.", font=F_B, fill=INK)
    px2 = x2 + 20
    bx = badge(sh, px2, y + 72, "Approved")
    sh.d.text((bx, y + 75), "v1.0", font=F_B, fill=INK)
    banner(sh, px2, y + 104, w - 40, "by Dr. Vikram Mehta on 22 Oct 2026, 5:52 pm. The record is "
           "locked and can no longer be edited.", "ok", bold_lead="Approved")
    sh.d.text((px2, y + 196), "Buttons now shown to the faculty member:", font=F_SB, fill=MUTED)
    sh.d.text((px2, y + 216), "(none — the record is locked)", font=F_S, fill=MUTED)

    # history growth
    hy = 470
    sh.d.text((SCREEN_X, hy - 24), "Version history after the decision (UI-WF-06, lower card)",
              font=F_SB, fill=MUTED)
    sh.d.rectangle([SCREEN_X, hy, SCREEN_X + SCREEN_W, hy + 150], fill="white", outline=HAIR)
    entries = [("v1.0  uploaded by Dr. Ananya Rao", "22 Oct 2026, 5:48 pm", DARK),
               ("Sent back for revision  by Dr. Vikram Mehta", "22 Oct 2026, 5:49 pm", ERR),
               ("v1.1  uploaded by Dr. Ananya Rao", "22 Oct 2026, 5:51 pm", DARK),
               ("Approved  by Dr. Vikram Mehta", "22 Oct 2026, 5:52 pm", OK)]
    ey = hy + 14
    for text, when, colour in entries:
        sh.d.line([SCREEN_X + 18, ey - 2, SCREEN_X + 18, ey + 28], fill=colour, width=3)
        sh.d.text((SCREEN_X + 32, ey), text, font=F_SB, fill=INK)
        sh.d.text((SCREEN_X + 32, ey + 16), when, font=F_S, fill=MUTED)
        ey += 34

    sh.note("FR-025 / AC-03: approving sets the status to \"Approved\" and locks the record against "
            "edits by the faculty member (BR-004).", (x + w - 60, y + 240))
    sh.note("A comment is optional here, unlike a rejection, because nothing has to be corrected.",
            (x + 60, y + 150))
    sh.note("AC-07: the new status is shown immediately on the faculty member's and the "
            "coordinator's screens; the record also leaves the review queue.", (x2 + 300, y + 86))
    sh.note("FR-032: the decision is appended to the version history, which therefore records the "
            "whole review trail, not just the current state.", (SCREEN_X + 480, hy + 100))
    sh.note("Only the department coordinator may approve. The IQAC lead can later send an approved "
            "record back for re-audit (FR-029), which unlocks it again.")
    sh.save("UI-Wireframe-10-Approve-Dialog.png")


def wf11_search():
    sh = Sheet("UI-WF-11", "Search and Filter Evidence — results",
               "UC-016 main flow · FR-034 to FR-039", 880)
    x, y, w = SCREEN_X, 126, SCREEN_W
    screen(sh, x, y, w, 700)
    cy = header_bar(sh, x + 2, y + 2, w - 4, "Prof. Sunita Krishnan", "IQAC Lead")
    sidebar(sh, x + 2, cy, 200, 698 - 48, NAV_IQAC, "Search evidence")
    px, pw = x + 226, w - 250
    py = page_header(sh, px, cy + 18, pw, "Search evidence",
                     "Submitted evidence from every department. Drafts are private to their "
                     "authors and never appear here.")

    sh.d.rectangle([px, py, px + pw, py + 196], fill="white", outline=HAIR)
    fx, fw = px + 16, (pw - 64) // 4
    row = py + 16
    field(sh, fx, row, fw, "Search words", "", hint="Looks in titles and descriptions.")
    field(sh, fx + (fw + 16), row, fw, "Criterion", "All criteria", kind="select")
    field(sh, fx + 2 * (fw + 16), row, fw, "Department", "All departments", kind="select")
    field(sh, fx + 3 * (fw + 16), row, fw, "Status", "Any status", kind="select")
    row += 96
    sh.d.text((fx, row), "Academic year", font=F_BB, fill=INK)
    row += 22
    cxx = fx
    for i, yr in enumerate(["2022-23", "2023-24", "2024-25", "2025-26", "2026-27"]):
        sh.d.rectangle([cxx, row, cxx + 14, row + 14], fill="white", outline=LINE)
        if i in (2, 3):
            sh.d.line([cxx + 3, row + 7, cxx + 6, row + 11], fill=INK, width=2)
            sh.d.line([cxx + 6, row + 11, cxx + 11, row + 3], fill=INK, width=2)
        sh.d.text((cxx + 22, row - 1), yr, font=F_B, fill=INK)
        cxx += 112
    row += 32
    bx = button(sh, fx, row, "Search", "primary")
    button(sh, bx, row, "Clear filters", "link")
    py += 212

    sh.d.text((px, py), "14 records found", font=F_S, fill=MUTED)
    py += 22
    py = table(sh, px, py, pw,
               ["Title", "Dept", "Criterion", "Sub-metric", "Year", "Status", "Version", "Last updated"],
               [182, 56, 120, 78, 70, 124, 60, 0],
               [[("link", "Workshop on Research…"), "CSE", "3. Research…", "3.2.1", "2025-26",
                 "Approved", "v1.1", "22 Oct, 9:06 pm"],
                [("link", "ECE robotics workshop"), "ECE", "3. Research…", "3.2.1", "2024-25",
                 "Pending review", "v1.0", "22 Oct, 8:41 pm"],
                [("link", "Enrolment register 3"), "CSE", "2. Teaching…", "2.1.1", "2024-25",
                 "Approved", "v1.0", "21 Oct, 4:02 pm"]])
    sh.d.text((px + pw - 290, py), "Previous", font=F_SB, fill=MUTED)
    sh.d.text((px + pw - 180, py), "Page 1 of 2", font=F_S, fill=INK)
    button(sh, px + pw - 80, py - 8, "Next", "secondary", h=28, font=F_SB)

    sh.note("FR-034: the search words are matched against the title AND the description.",
            (fx + fw - 20, py - 466))
    sh.note("FR-035 to FR-038: criterion, department, status and academic year each narrow the "
            "results; FR-036 allows several years at once.", (fx + 230, py - 322))
    sh.note("FR-039: every filter can be combined with every other. The filters are kept in the "
            "page address, so a search can be bookmarked and the IQAC dashboard can link straight "
            "to a filtered list.", (fx + 60, py - 268))
    sh.note("The number of matches is announced above the table so it is read out by screen readers "
            "when it changes.", (px + 120, py - 236))
    sh.note("UC-016: long result lists are paginated, ten rows per page.", (px + pw - 50, py + 6))
    sh.note("Drafts are never returned here, whoever searches (FR-018).")
    sh.note("Selecting a row opens the evidence detail screen with the full metadata, status and "
            "version history (UI-WF-06).")
    sh.save("UI-Wireframe-11-Search-Results.png")


def wf12_search_exceptions():
    sh = Sheet("UI-WF-12", "Search — exceptional flows",
               "UC-016 alternative flows", 720)
    x, y, w = SCREEN_X, 126, 680
    screen(sh, x, y, w, 250, "State A — no match (UC-016 alternative flow 1)")
    px, pw = x + 20, w - 40
    sh.d.text((px, y + 18), "Search evidence", font=F_H, fill=INK)
    sh.d.rectangle([px, y + 50, px + pw, y + 96], fill="white", outline=HAIR)
    sh.d.text((px + 12, y + 66), "Search words:  \"bioinformatics\"      Criterion: 5      "
              "Year: 2022-23", font=F_S, fill=INK)
    sh.d.rectangle([px, y + 112, px + pw, y + 216], fill="white", outline=LINE)
    sh.d.text((px + pw / 2, y + 150), "No results found", font=F_H, fill=INK, anchor="mm")
    sh.d.text((px + pw / 2, y + 178), "Try fewer filters or different search words.",
              font=F_S, fill=MUTED, anchor="mm")

    y2 = y + 300
    screen(sh, x, y2, w, 250, "State B — department filter outside the user's scope "
           "(UC-016 alternative flow 2)")
    sh.d.text((px, y2 + 18), "Search evidence", font=F_H, fill=INK)
    sh.para(px, y2 + 42, "Submitted evidence from your department, Computer Science and "
            "Engineering (CSE).", F_S, MUTED, pw)
    sh.d.rectangle([px, y2 + 70, px + pw, y2 + 112], fill="white", outline=HAIR)
    sh.d.text((px + 12, y2 + 84), "Department:  ECE \u2014 Electronics and Communication "
              "Engineering", font=F_S, fill=INK)
    banner(sh, px, y2 + 126, pw, "You can only search evidence from your own department (CSE), so "
           "your department was used instead of the one you chose.", "info")
    sh.d.text((px, y2 + 196), "13 records found  \u2014  all from CSE", font=F_S, fill=MUTED)

    sh.note("UC-016 alternative flow 1: when nothing matches, a plain message replaces the table "
            "rather than an empty grid, and the filters stay on screen so they can be relaxed.",
            (px + pw - 40, y + 164))
    sh.note("UC-016 alternative flow 2: a faculty member or coordinator who asks for another "
            "department is NOT shown an error and is NOT given the data. The server silently "
            "substitutes their own department and the screen says so.", (px + pw - 40, y2 + 140))
    sh.note("The IQAC Lead and the System Administrator are institution-wide roles, so this notice "
            "never appears for them; their department filter works as chosen.")
    sh.note("Deciding the scope on the server rather than hiding the control means a hand-written "
            "request cannot reach another department's records either (NFR-006).")
    sh.save("UI-Wireframe-12-Search-Exceptions.png")


def screen_flow():
    sh = Sheet("UI-FLOW", "Screen Flow and Navigation Map",
               "UC-004  ·  UC-011  ·  UC-016", 860)
    d = sh.d
    BW, BH = 196, 54

    def box(x, y, label, sub=None, kind="plain", w=BW, h=BH):
        fill = {"plain": "white", "start": BAR, "end": OK_BG, "alt": ERR_BG}[kind]
        d.rounded_rectangle([x, y, x + w, y + h], 6, fill=fill, outline=LINE, width=2)
        if sub:
            d.text((x + w / 2, y + h / 2 - 9), label, font=F_BB, fill=INK, anchor="mm")
            d.text((x + w / 2, y + h / 2 + 10), sub, font=F_S, fill=MUTED, anchor="mm")
        else:
            d.text((x + w / 2, y + h / 2), label, font=F_BB, fill=INK, anchor="mm")
        return (x, y, w, h)

    col = [SCREEN_X + 10, SCREEN_X + 270, SCREEN_X + 530, SCREEN_X + 790]
    # Sign in
    box(col[0], 130, "Sign In", "UI-WF-01", "start")
    d.text((col[0], 112), "Shared", font=F_SB, fill=MUTED)

    # UC-004 row
    d.text((col[0], 212), "UC-004  Upload Evidence   (Faculty)", font=F_H2, fill=INK)
    box(col[0], 234, "My evidence", "UI-WF-03")
    box(col[1], 234, "Upload evidence", "UI-WF-04")
    box(col[2], 234, "Validation errors", "UI-WF-05", "alt")
    box(col[3], 234, "Evidence detail", "UI-WF-06", "end")
    arrow(sh, col[0] + BW, 261, col[1] - 4, 261, "Upload evidence")
    arrow(sh, col[1] + BW, 251, col[2] - 4, 251, "invalid")
    arrow(sh, col[2] + 70, 234 - 4, col[1] + 130, 234 - 4)
    d.text((col[1] + BW + 36, 214), "correct and retry", font=F_S, fill=NOTE_C)
    arrow(sh, col[2] + BW, 274, col[3] - 4, 274, "submit")
    arrow(sh, col[1] + 100, 234 + BH, col[1] + 100, 318)
    arrow(sh, col[1] + 100, 318, col[3] + 100, 318)
    arrow(sh, col[3] + 100, 318, col[3] + 100, 234 + BH + 2, "save draft / submit")

    # UC-011 row
    d.text((col[0], 380), "UC-011  Review Submitted Evidence   (Department Coordinator)",
           font=F_H2, fill=INK)
    box(col[0], 402, "Review queue", "UI-WF-07")
    box(col[1], 402, "Review evidence", "UI-WF-08")
    box(col[2], 372, "Reject + feedback", "UI-WF-09", "alt")
    box(col[2], 444, "Approve + lock", "UI-WF-10", "end")
    box(col[3], 402, "Evidence detail", "status updated")
    arrow(sh, col[0] + BW, 429, col[1] - 4, 429, "Review")
    arrow(sh, col[1] + BW, 414, col[2] - 4, 399, "Reject")
    arrow(sh, col[1] + BW, 444, col[2] - 4, 471, "Approve")
    arrow(sh, col[2] + BW, 399, col[3] - 4, 416, "Needs revision")
    arrow(sh, col[2] + BW, 471, col[3] - 4, 442, "Approved")
    arrow(sh, col[2] + 98, 372 - 4, col[2] + 98, 348)
    arrow(sh, col[2] + 98, 348, col[0] + 300, 348)
    arrow(sh, col[0] + 300, 348, col[0] + 100, 348)
    arrow(sh, col[0] + 100, 348, col[0] + 100, 402 - 4, "feedback empty: blocked")

    # UC-016 row
    d.text((col[0], 560), "UC-016  Search and Filter Evidence   (any signed-in user)",
           font=F_H2, fill=INK)
    box(col[0], 582, "Search evidence", "UI-WF-11")
    box(col[1], 582, "Results + paging", "UI-WF-11")
    box(col[2], 554, "No results found", "UI-WF-12", "alt")
    box(col[2], 626, "Scope notice", "UI-WF-12", "alt")
    box(col[3], 582, "Evidence detail", "UI-WF-06", "end")
    arrow(sh, col[0] + BW, 609, col[1] - 4, 609, "Search")
    arrow(sh, col[1] + BW, 594, col[2] - 4, 581, "no match")
    arrow(sh, col[1] + BW, 624, col[2] - 4, 653, "other department")
    arrow(sh, col[2] + BW, 653, col[3] - 4, 620, "own department only")
    arrow(sh, col[1] + 98, 582 + BH, col[1] + 98, 668)
    arrow(sh, col[1] + 98, 668, col[3] + 98, 668)
    arrow(sh, col[3] + 98, 668, col[3] + 98, 582 + BH + 2, "select a record")
    arrow(sh, col[2] + 98, 554 - 4, col[2] + 98, 534)
    arrow(sh, col[2] + 98, 534, col[0] + 100, 534)
    arrow(sh, col[0] + 100, 534, col[0] + 100, 582 - 4, "relax the filters")

    # from sign-in into the three use cases
    arrow(sh, col[0] + 60, 130 + BH, col[0] + 60, 234 - 4, "by role")

    sh.note("Every flow starts at Sign In. The landing page depends on the role (FR-008), so the "
            "three use cases begin on different screens.")
    sh.note("Grey = entry point, white = normal screen, red tint = alternative or exceptional flow, "
            "green tint = the use case's post-condition.")
    sh.note("UC-004 ends with an evidence record in \"Pending Review\" that is visible in the "
            "coordinator's queue, which is exactly UC-011's precondition.")
    sh.note("UC-011 ends with the record Approved (locked) or Needs revision (with feedback). "
            "Needs revision leads to UC-012, which re-enters UC-011 at the queue.")
    sh.note("UC-016 is reachable from every role's sidebar and ends at the same evidence detail "
            "screen used by the other two use cases.")
    sh.note("Session expiry (FR-007) can interrupt any screen here and returns the user to Sign In; "
            "the arrow is omitted everywhere to keep the map readable.")
    sh.save("Screen-Flow-Map.png")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("Writing wireframes to", OUT_DIR)
    for fn in (wf01_sign_in, wf02_shell, wf03_my_evidence, wf04_upload, wf05_upload_errors,
               wf06_detail, wf07_queue, wf08_review, wf09_reject, wf10_approve,
               wf11_search, wf12_search_exceptions, screen_flow):
        fn()
    print("Done.")


if __name__ == "__main__":
    main()
