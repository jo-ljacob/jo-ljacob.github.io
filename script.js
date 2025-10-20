const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImage");
const closeBtn = document.querySelector(".close");

document.querySelectorAll(".gallery_grid img").forEach(img => {
    img.addEventListener("click", () => {
    modal.style.display = "flex";
    modalImg.src = img.src;
    });
});

closeBtn.onclick = () => modal.style.display = "none";
modal.onclick = e => { if (e.target === modal) modal.style.display = "none"; };