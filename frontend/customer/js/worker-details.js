document.addEventListener("DOMContentLoaded", function () {
    const workerData = sessionStorage.getItem('selectedWorker');
    
    if (workerData) {
        const worker = JSON.parse(workerData);

        document.title = `خدمة | تفاصيل الفني ${worker.name}`;
        
        if (document.getElementById('worker-name')) document.getElementById('worker-name').textContent = worker.name;
        if (document.getElementById('breadcrumb-name')) document.getElementById('breadcrumb-name').textContent = worker.name;
        if (document.getElementById('worker-job')) document.getElementById('worker-job').textContent = worker.job;
        if (document.getElementById('worker-price')) document.getElementById('worker-price').textContent = worker.price + ' ج.م';
        if (document.getElementById('worker-img')) document.getElementById('worker-img').src = worker.img;
        if (document.getElementById('worker-rating')) document.getElementById('worker-rating').textContent = worker.rating;
    }
});