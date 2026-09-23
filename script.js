const experience = document.querySelector(".experience");
const envelopeTrigger = document.querySelector("#envelopeTrigger");
const envelopeRig = document.querySelector("#envelopeRig");
const cardSleeve = document.querySelector("#cardSleeve");
const saveCard = document.querySelector("#saveCard");
const rsvpSeal = document.querySelector("#rsvpSeal");
const rsvpDialog = document.querySelector("#rsvpDialog");
const closeDialog = document.querySelector("#closeDialog");
const rsvpForm = document.querySelector("#rsvpForm");
const guestName = document.querySelector("#guestName");
const guestOptions = document.querySelector("#guestOptions");
const attendingName = document.querySelector("#attendingName");
const formMessage = document.querySelector("#formMessage");
const finalCard = document.querySelector("#finalCard");

// Temporary names for interaction testing. This array will be replaced by
// private Supabase search once the final guest list is ready.
const demoGuests = ["Dunia Valle", "Lincoln Espinal"];
let selectedGuest = "";
let opening = false;
let awaitingDismissal = false;

function positionCardInEnvelope() {
  if (opening) return;
  const cardHeight = saveCard.offsetHeight;
  const envelopeHeight = envelopeRig.clientHeight;
  saveCard.style.bottom = `${-cardHeight + envelopeHeight * 0.62}px`;
}

document.fonts.ready.then(positionCardInEnvelope);
window.addEventListener("load", positionCardInEnvelope, { once: true });
window.addEventListener("resize", positionCardInEnvelope);

envelopeTrigger.addEventListener("click", openEnvelope);

async function openEnvelope() {
  if (awaitingDismissal) {
    releaseCard();
    return;
  }

  if (opening) return;
  opening = true;
  envelopeTrigger.disabled = true;
  experience.classList.add("is-open");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cardStart = saveCard.getBoundingClientRect();
  const finalTop = Math.max(18, (window.innerHeight - cardStart.height) / 2);
  const rise = finalTop - cardStart.top;

  if (reducedMotion) {
    saveCard.style.transform = `translateY(${rise}px)`;
    pauseWithEnvelopeOpen();
    return;
  }

  await wait(680);

  const cardMotion = saveCard.animate(
    [
      { transform: "translateY(0) rotate(-0.3deg)", offset: 0 },
      { transform: `translateY(${rise * 0.72}px) rotate(0.18deg)`, offset: 0.72 },
      { transform: `translateY(${rise - 8}px) rotate(-0.08deg)`, offset: 0.91 },
      { transform: `translateY(${rise}px) rotate(0deg)`, offset: 1 },
    ],
    { duration: 2050, easing: "cubic-bezier(0.18, 0.72, 0.16, 1)", fill: "forwards" },
  );

  await cardMotion.finished;
  pauseWithEnvelopeOpen();
}

function pauseWithEnvelopeOpen() {
  opening = false;
  awaitingDismissal = true;
  envelopeTrigger.disabled = false;
  envelopeTrigger.setAttribute("aria-label", "Continue to the invitation");
  experience.classList.add("is-awaiting-dismissal");
}

function releaseCard() {
  awaitingDismissal = false;
  opening = true;
  envelopeTrigger.disabled = true;
  const rect = saveCard.getBoundingClientRect();
  const finalTop = Math.max(18, (window.innerHeight - rect.height) / 2);
  const finalLeft = Math.max(12, (window.innerWidth - rect.width) / 2);
  saveCard.getAnimations().forEach((animation) => animation.cancel());
  Object.assign(saveCard.style, {
    position: "fixed",
    top: `${finalTop}px`,
    left: `${finalLeft}px`,
    bottom: "auto",
    width: `${rect.width}px`,
    minHeight: `${rect.height}px`,
    transform: "none",
  });
  experience.append(saveCard);
  saveCard.inert = false;
  saveCard.setAttribute("aria-hidden", "false");
  experience.classList.remove("is-awaiting-dismissal");
  experience.classList.add("is-released");

  window.setTimeout(() => {
    envelopeRig.hidden = true;
    rsvpSeal.focus({ preventScroll: true });
  }, 520);
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

rsvpSeal.addEventListener("click", () => {
  rsvpDialog.showModal();
  window.setTimeout(() => guestName.focus(), 120);
});

closeDialog.addEventListener("click", () => rsvpDialog.close());

rsvpDialog.addEventListener("click", (event) => {
  if (event.target === rsvpDialog) rsvpDialog.close();
});

guestName.addEventListener("input", () => {
  selectedGuest = "";
  attendingName.textContent = guestName.value.trim().toUpperCase() || "YOUR NAME";
  renderGuestOptions(guestName.value);
  formMessage.textContent = "";
});

guestName.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideGuestOptions();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".guest-field")) hideGuestOptions();
});

rsvpForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const reply = new FormData(rsvpForm).get("reply");

  if (!selectedGuest) {
    formMessage.textContent = "PLEASE SELECT YOUR NAME FROM THE LIST.";
    guestName.focus();
    return;
  }

  if (!reply) {
    formMessage.textContent = "PLEASE CHOOSE YOUR REPLY.";
    return;
  }

  saveResponse(selectedGuest, reply);
});

function renderGuestOptions(query) {
  const normalized = query.trim().toLowerCase();
  guestOptions.replaceChildren();

  if (!normalized) {
    hideGuestOptions();
    return;
  }

  const matches = demoGuests.filter((guest) => guest.toLowerCase().includes(normalized));
  if (!matches.length) {
    hideGuestOptions();
    formMessage.textContent = "WE COULDN'T FIND THAT NAME.";
    return;
  }

  matches.forEach((guest) => {
    const item = document.createElement("li");
    item.setAttribute("role", "option");

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = guest;
    button.addEventListener("click", () => selectGuest(guest));

    item.append(button);
    guestOptions.append(item);
  });

  guestOptions.hidden = false;
  guestName.setAttribute("aria-expanded", "true");
}

function selectGuest(guest) {
  selectedGuest = guest;
  guestName.value = guest;
  attendingName.textContent = guest.toUpperCase();
  formMessage.textContent = "";
  hideGuestOptions();
}

function hideGuestOptions() {
  guestOptions.hidden = true;
  guestName.setAttribute("aria-expanded", "false");
}

function saveResponse(name, reply) {
  const response = {
    guestName: name,
    reply,
    submittedAt: new Date().toISOString(),
  };

  // Temporary local persistence for the prototype. This is intentionally
  // isolated so it can be replaced by a Supabase insert later.
  localStorage.setItem("miselems-rsvp-demo", JSON.stringify(response));

  formMessage.textContent = "REPLY SAVED.";
  window.setTimeout(() => {
    if (rsvpDialog.open) rsvpDialog.close();
    experience.classList.add("is-open", "is-complete");
    finalCard.setAttribute("aria-hidden", "false");
  }, 450);

  return response;
}

function registerWebsiteTools() {
  const context = document.modelContext;
  if (!context?.registerTool) return;

  const allowedReplies = ["attending", "likely", "declined"];

  try {
    void Promise.resolve(
      context.registerTool({
        name: "submit_rsvp",
        title: "Submit wedding RSVP",
        description: "Submit one listed guest's reply and show the completed RSVP paper.",
        inputSchema: {
          type: "object",
          properties: {
            guestName: { type: "string", description: "The guest's full listed name." },
            reply: { type: "string", enum: allowedReplies },
          },
          required: ["guestName", "reply"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (!input || typeof input.guestName !== "string" || !demoGuests.includes(input.guestName)) {
            throw new Error("Select a name that appears on the guest list.");
          }
          if (!allowedReplies.includes(input.reply)) {
            throw new Error("Choose attending, likely, or declined.");
          }

          selectedGuest = input.guestName;
          guestName.value = input.guestName;
          attendingName.textContent = input.guestName.toUpperCase();
          const response = saveResponse(input.guestName, input.reply);
          return { guestName: response.guestName, reply: response.reply, saved: true };
        },
      }),
    ).catch(() => {});
  } catch {
    // Browsers without WebMCP continue to use the visible RSVP form.
  }
}

registerWebsiteTools();
