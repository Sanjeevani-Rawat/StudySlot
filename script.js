
        let exams = [];
        let currentExamIndex = null;

        const statusNames = {
            "upcoming": "Upcoming",
            "cleared": "Cleared (Passed)",
            "not-cleared": "Not Cleared (Failed)",
            "missed": "Missed (Didn't Attend)"
        };

        function loadExams() {
            try {
                const stored = localStorage.getItem('exams');
                if (stored) {
                    exams = JSON.parse(stored);
                }
            } catch (e) {
                console.error('Error loading exams:', e);
                exams = [];
            }
        }

        function saveExams() {
            try {
                localStorage.setItem('exams', JSON.stringify(exams));
            } catch (e) {
                console.error('Error saving exams:', e);
            }
        }

        function updateDateTime() {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            const datetimeElement = document.getElementById('datetime');
            if (datetimeElement) {
                datetimeElement.textContent = now.toLocaleDateString('en-IN', options);
            }
        }

        function calculateDaysLeft(examDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const exam = new Date(examDate);
            exam.setHours(0, 0, 0, 0);
            const diffTime = exam - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            return date.toLocaleDateString('en-IN', options);
        }

        function updateStats() {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const attemptedCount = exams.filter(exam => {
                const daysLeft = calculateDaysLeft(exam.date);
                return daysLeft < 0 && exam.status !== 'missed';
            }).length;

            const clearedCount = exams.filter(exam => exam.status === 'cleared').length;
            const notClearedCount = exams.filter(exam => exam.status === 'not-cleared').length;
            const missedCount = exams.filter(exam => exam.status === 'missed').length;

            const examsThisMonth = exams.filter(exam => {
                const examDate = new Date(exam.date);
                return examDate.getMonth() === currentMonth && examDate.getFullYear() === currentYear;
            }).length;

            document.getElementById('exams-filled').textContent = exams.length;
            document.getElementById('attempted-exams').textContent = attemptedCount;
            document.getElementById('cleared-exams').textContent = clearedCount;
            document.getElementById('not-cleared').textContent = notClearedCount;
            document.getElementById('missed-exams').textContent = missedCount;
            document.getElementById('exam-month').textContent = examsThisMonth;
        }

        function sortExamsByDate() {
            exams.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateA - dateB;
            });
        }

        function renderExamCards() {
            const container = document.getElementById('exam-cards');
            const noExamsMessage = document.getElementById('no-exams-message');

            if (!container || !noExamsMessage) {
                console.error('Container elements not found');
                return;
            }

            sortExamsByDate();

            if (exams.length === 0) {
                container.innerHTML = '';
                noExamsMessage.style.display = 'block';
            } else {
                noExamsMessage.style.display = 'none';
                container.innerHTML = '';

                exams.forEach((exam, index) => {
                    const daysLeft = calculateDaysLeft(exam.date);
                    const card = document.createElement('div');
                    card.className = 'exam-card';

                    let statusText = '';
                    let statusClass = '';

                    if (daysLeft > 0) {
                        statusText = daysLeft + ' days left';
                        statusClass = 'days-left';
                    } else if (daysLeft === 0) {
                        statusText = 'Today!';
                        statusClass = 'days-left';
                    } else {
                        statusText = 'Completed';
                        statusClass = 'days-left';
                    }

                    const statusBadge = exam.status || 'upcoming';

                    card.innerHTML = `
                        <h3>${exam.name}</h3>
                        <div class="exam-date">📅 ${formatDate(exam.date)}</div>
                        <div class="${statusClass}">${statusText}</div>
                        <div class="status-badge status-${statusBadge}">${statusNames[statusBadge]}</div>
                    `;
                    card.onclick = () => openModal(index);
                    container.appendChild(card);
                });
            }

            updateStats();
        }

        function openModal(index) {
            currentExamIndex = index;
            const exam = exams[index];
            const daysLeft = calculateDaysLeft(exam.date);

            // Reset to view mode
            document.getElementById('view-mode').classList.remove('hidden');
            document.getElementById('edit-mode').classList.remove('active');

            document.getElementById('modal-exam-name').textContent = exam.name;
            document.getElementById('modal-exam-date').textContent = formatDate(exam.date);
            document.getElementById('modal-exam-status').value = exam.status || 'upcoming';

            let daysText = '';
            if (daysLeft > 0) {
                daysText = daysLeft + ' days remaining';
            } else if (daysLeft === 0) {
                daysText = 'Exam is today!';
            } else {
                daysText = 'Exam completed';
            }
            document.getElementById('modal-days-left').textContent = daysText;

            document.getElementById('modal-test-procedure').textContent = exam.procedure;
            document.getElementById('modal-more-details').textContent = exam.details || 'No additional details';

            const linksText = exam.links || 'No links added';
            if (exam.links) {
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const formattedLinks = linksText.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
                document.getElementById('modal-links').innerHTML = formattedLinks;
            } else {
                document.getElementById('modal-links').textContent = linksText;
            }

            document.getElementById('exam-modal').style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            document.getElementById('exam-modal').style.display = 'none';
            document.body.style.overflow = 'auto';
            currentExamIndex = null;
        }

        window.onclick = function(event) {
            const modal = document.getElementById('exam-modal');
            if (event.target === modal) {
                closeModal();
            }
        }

        // Enable Edit Mode
        function enableEditMode() {
            if (currentExamIndex === null) return;

            const exam = exams[currentExamIndex];

            // Populate edit form
            document.getElementById('edit-exam-name').value = exam.name;
            document.getElementById('edit-exam-date').value = exam.date;
            document.getElementById('edit-test-procedure').value = exam.procedure;
            document.getElementById('edit-more-details').value = exam.details || '';
            document.getElementById('edit-exam-links').value = exam.links || '';

            // Switch to edit mode
            document.getElementById('view-mode').classList.add('hidden');
            document.getElementById('edit-mode').classList.add('active');
        }

        // Cancel Edit Mode
        function cancelEditMode() {
            document.getElementById('view-mode').classList.remove('hidden');
            document.getElementById('edit-mode').classList.remove('active');
        }

        // Save Edited Exam
        function saveEditedExam() {
            if (currentExamIndex === null) return;

            const updatedExam = {
                name: document.getElementById('edit-exam-name').value.trim(),
                date: document.getElementById('edit-exam-date').value,
                procedure: document.getElementById('edit-test-procedure').value.trim(),
                details: document.getElementById('edit-more-details').value.trim(),
                links: document.getElementById('edit-exam-links').value.trim(),
                status: exams[currentExamIndex].status || 'upcoming'
            };

            exams[currentExamIndex] = updatedExam;
            saveExams();

            cancelEditMode();
            closeModal();
            renderExamCards();

            alert('✅ Exam details updated successfully!');
        }

        function saveStatus() {
            if (currentExamIndex === null) return;

            const newStatus = document.getElementById('modal-exam-status').value;
            exams[currentExamIndex].status = newStatus;
            saveExams();

            renderExamCards();
        }

        function deleteExam() {
            if (currentExamIndex === null) return;

            if (confirm('Are you sure you want to delete this exam?')) {
                exams.splice(currentExamIndex, 1);
                saveExams();
                closeModal();
                renderExamCards();
                alert('🗑️ Exam deleted successfully!');
            }
        }

        document.getElementById('exam-form').addEventListener('submit', function(e) {
            e.preventDefault();

            const newExam = {
                name: document.getElementById('exam-name').value.trim(),
                date: document.getElementById('exam-date').value,
                procedure: document.getElementById('test-procedure').value.trim(),
                details: document.getElementById('more-details').value.trim(),
                links: document.getElementById('exam-links').value.trim(),
                status: 'upcoming'
            };

            exams.push(newExam);
            saveExams();

            this.reset();
            renderExamCards();

            alert('✅ Exam added successfully!');
        });

        function initApp() {
            loadExams();
            updateDateTime();
            renderExamCards();
            setInterval(updateDateTime, 1000);

            console.log('App initialized with', exams.length, 'exams');
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initApp);
        } else {
            initApp();
        }