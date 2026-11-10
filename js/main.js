function filterWorkers(event, job) {
    if (event) {
        event.preventDefault();
    }

    const workers = document.querySelectorAll(".worker-card");
    
    workers.forEach(worker => {
        const workerJob = worker.getAttribute("data-job");

        if (job === "all" || workerJob === job) {
            worker.style.display = "flex";
        } else {
            worker.style.display = "none";
        }
    });
    const workersSection = document.getElementById("workers");
    if (workersSection) {
        workersSection.scrollIntoView({ behavior: "smooth" });
    }
}