window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedJob = urlParams.get('job');

    if (selectedJob) {
        console.log("المهنة المطلوبة هي: " + selectedJob);
    }
});