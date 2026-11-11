window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedJob = urlParams.get('job');

    if (selectedJob) {
        console.log("المهنة المطلوبة هي: " + selectedJob);
    }
});
function saveWorkerData(name, job, price, img, rating) {
    const worker = { name, job, price, img, rating };
    sessionStorage.setItem('selectedWorker', JSON.stringify(worker));
}