function saveOptions() {
  const schoolId = (document.getElementById('schoolSelection') as HTMLSelectElement).value;
  console.log(`Saving ${schoolId}`);
  chrome.storage.sync.set({ schoolId }, window.close);
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get((['schoolId']), (({schoolId = '222'}) => {
    console.log(schoolId);
    (document.getElementById(schoolId) as HTMLOptionElement).selected = true;
  }));
}

document.getElementById('save').addEventListener('click', saveOptions);
document.addEventListener('DOMContentLoaded', restoreOptions);
