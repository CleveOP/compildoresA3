document.addEventListener('DOMContentLoaded', async () => {
    const kanbanColumns = document.querySelectorAll('.kanban-cards');
    const createTaskBtn = document.getElementById('create-task-btn');
    const taskTitleInput = document.getElementById('task-title');
    const taskPrioritySelect = document.getElementById('task-priority');
    const taskDeadlineInput = document.getElementById('task-deadline');
    const errorMessage = document.getElementById('error-message');
    const pendingColumn = document.querySelector('.kanban-cards[data-column-id="1"]');
    const managerPassword = "gerente";
    let draggedCard = null;
    let isManager = false; // Variável para armazenar se o usuário é gerente

    // Simula uma chamada ao servidor para verificar se o usuário é gerente
    async function checkIfManager() {
        try {
            // Simulação de uma chamada ao servidor
            const response = await fetch('/api/check-user-role'); // Substitua pela URL real da API
            const data = await response.json();
            isManager = data.isManager; // Supondo que a API retorna { isManager: true/false }
        } catch (error) {
            console.error('Erro ao verificar o papel do usuário:', error);
            isManager = false; // Por padrão, assume que o usuário não é gerente em caso de erro
        }
    }

    // Chama a função para verificar se o usuário é gerente ao carregar a página
    await checkIfManager();

    // Função para buscar uma imagem aleatória da API Random User
    async function fetchRandomUserImage() {
        try {
            const response = await fetch('https://randomuser.me/api/');
            const data = await response.json();
            return data.results[0].picture.large; // Retorna a URL da foto grande
        } catch (error) {
            console.error('Erro ao buscar imagem da API:', error);
            return './img/smile-2072907_640.jpg'; // Retorna uma imagem padrão em caso de erro
        }
    }

    // Função para criar um novo card HTML
    async function createNewCard(title, priority) {
        const card = document.createElement('div');
        card.classList.add('kanban-card');
        card.setAttribute('draggable', false); // Inicialmente, a tarefa não pode ser arrastada
        card.dataset.type = 'fazer'; // Todas as novas tarefas começam como "FAZER"

        const badge = document.createElement('div');
        badge.classList.add('badge', priority);
        badge.innerHTML = `<span>${priority === 'high' ? 'Alta prioridade' : (priority === 'medium' ? 'Média prioridade' : 'Baixa prioridade')}</span>`;

        const cardTitle = document.createElement('p');
        cardTitle.classList.add('card-title');
        cardTitle.textContent = title;

        const cardInfos = document.createElement('div');
        cardInfos.classList.add('card-infos');
        const randomImageURL = await fetchRandomUserImage(); // Busca a URL da imagem
        cardInfos.innerHTML = `
            <div class="card-icons">
                <p class="comment-icon"><i class="fa-regular fa-comment"></i> 0</p>
                <p class="attachment-icon"><i class="fa-solid fa-paperclip"></i> 0</p>
            </div>
            <div class="user">
                <img src="${randomImageURL}" alt="User">
            </div>
        `;

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-card-btn');
        deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';

        const approveButton = document.createElement('button');
        approveButton.classList.add('approve-card-btn');
        approveButton.textContent = 'Aprovar';

        card.appendChild(badge);
        card.appendChild(cardTitle);
        card.appendChild(cardInfos);
        card.appendChild(deleteButton);
        card.appendChild(approveButton);

        // Evento para aprovar a tarefa
        approveButton.addEventListener('click', (e) => {
            if (!isManager) {
                alert('Apenas gerentes podem aprovar tarefas.');
                const enteredPassword = prompt("Digite a senha do gerente para aprovar esta tarefa:");
                if (enteredPassword === managerPassword) {
                    card.classList.add('approved');
                    card.setAttribute('draggable', true); // Permite arrastar após aprovação
                    approveButton.remove(); // Remove o botão "Aprovar" após aprovação
                    alert('Tarefa aprovada com sucesso!');
                } else if (enteredPassword !== null) {
                    alert("Senha incorreta. A tarefa não foi aprovada.");
                }
                return;
            }

            const enteredPassword = prompt("Digite a senha do gerente para aprovar esta tarefa:");
            if (enteredPassword === managerPassword) {
                card.classList.add('approved');
                card.setAttribute('draggable', true); // Permite arrastar após aprovação
                approveButton.remove(); // Remove o botão "Aprovar" após aprovação
                alert('Tarefa aprovada com sucesso!');
            } else if (enteredPassword !== null) {
                alert("Senha incorreta. A tarefa não foi aprovada.");
            }
        });

        // Evento para excluir a tarefa
        deleteButton.addEventListener('click', (e) => {
            const cardToDelete = e.target.closest('.kanban-card');
            if (cardToDelete) {
                cardToDelete.remove();
            }
            e.stopPropagation();
        });

        // Evento para o ícone de comentários
        const commentIcon = cardInfos.querySelector('.comment-icon');
        commentIcon.addEventListener('click', () => {
            const comment = prompt('Adicione um comentário para esta tarefa:');
            if (comment) {
                const commentCount = parseInt(commentIcon.textContent.trim()) || 0;
                commentIcon.innerHTML = `<i class="fa-regular fa-comment"></i> ${commentCount + 1}`;
                alert(`Comentário adicionado: "${comment}"`);
            }
        });

        // Evento para o ícone de anexos
        const attachmentIcon = cardInfos.querySelector('.attachment-icon');
        attachmentIcon.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '*/*'; // Permite qualquer tipo de arquivo
            fileInput.onchange = () => {
                const file = fileInput.files[0];
                if (file) {
                    const attachmentCount = parseInt(attachmentIcon.textContent.trim()) || 0;
                    attachmentIcon.innerHTML = `<i class="fa-solid fa-paperclip"></i> ${attachmentCount + 1}`;
                    alert(`Arquivo anexado: "${file.name}"`);
                }
            };
            fileInput.click();
        });

        // Eventos de drag and drop
        card.addEventListener('dragstart', (e) => {
            if (card.classList.contains('approved')) {
                draggedCard = e.target;
                e.target.classList.add('dragging');
            } else {
                e.preventDefault(); // Impede o arraste se não estiver aprovado
                alert('A tarefa precisa ser aprovada antes de ser movida.');
            }
        });

        card.addEventListener('dragend', () => {
            if (draggedCard) {
                draggedCard.classList.remove('dragging');
                draggedCard = null;
            }
        });

        return card;
    }

    // Adiciona o botão de aprovar e exclusão aos cards existentes na coluna pendente (agora também busca imagem)
    pendingColumn.querySelectorAll('.kanban-card').forEach(async card => {
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-card-btn');
        deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
        card.appendChild(deleteButton);

        const approveButton = document.createElement('button');
        approveButton.classList.add('approve-card-btn');
        approveButton.textContent = 'Aprovar';
        card.appendChild(approveButton);

        const userDiv = card.querySelector('.user');
        if (userDiv && userDiv.querySelector('img')) {
            const randomImageURL = await fetchRandomUserImage();
            userDiv.querySelector('img').src = randomImageURL;
        }

        approveButton.addEventListener('click', (e) => {
            if (!isManager) {
                alert('Apenas gerentes podem aprovar tarefas.');
                const enteredPassword = prompt("Digite a senha do gerente para aprovar esta tarefa:");
                if (enteredPassword === managerPassword) {
                    card.classList.add('approved');
                    card.setAttribute('draggable', true);
                    approveButton.remove();
                    e.stopPropagation();
                } else if (enteredPassword !== null) {
                    alert("Senha incorreta. A tarefa não foi aprovada.");
                }
                return;
            }

            const enteredPassword = prompt("Digite a senha do gerente para aprovar esta tarefa:");
            if (enteredPassword === managerPassword) {
                card.classList.add('approved');
                card.setAttribute('draggable', true);
                approveButton.remove();
                e.stopPropagation();
            } else if (enteredPassword !== null) {
                alert("Senha incorreta. A tarefa não foi aprovada.");
            }
        });

        deleteButton.addEventListener('click', (e) => {
            const cardToDelete = e.target.closest('.kanban-card');
            if (cardToDelete) {
                cardToDelete.remove();
            }
            e.stopPropagation();
        });

        card.setAttribute('draggable', false);
        card.addEventListener('dragstart', (e) => {
            if (card.classList.contains('approved')) {
                draggedCard = e.target;
                e.target.classList.add('dragging');
                console.log('Drag start (existing card):', draggedCard); // LOG
            } else {
                e.preventDefault();
            }
        });
        card.addEventListener('dragend', () => {
            if (draggedCard) {
                draggedCard.classList.remove('dragging');
                console.log('Drag end (existing card):', draggedCard); // LOG
                draggedCard = null;
            }
        });
    });

    // Adiciona uma tarefa "Revisar" como exemplo ao carregar a página
    const exampleCard = await createNewCard('Revisar', 'high');
    pendingColumn.appendChild(exampleCard);

    // Lógica de validação de conexões
    function isValidConnection(fromType, toColumnId) {
        const validConnections = {
            fazer: ['2'], // "FAZER" pode ir para "Em front end"
            verificar: ['3'], // "VERIFICAR" pode ir para "Em back end"
            aprovar: ['4'], // "APROVAR" pode ir para "Em teste"
            concluido: ['5'] // "Concluído" vai para a última coluna
        };
        return validConnections[fromType]?.includes(toColumnId);
    }

    // Função para validar o nome da tarefa
    function validateTaskTitle(title) {
        return title.trim().length > 0; // Verifica se o título não está vazio
    }

    // Função para validar o prazo
    function validateTaskDeadline(deadline) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // Formato YYYY-MM-DD
        if (!dateRegex.test(deadline)) return false;

        const date = new Date(deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Remove a hora para comparar apenas a data

        return !isNaN(date.getTime()) && date >= today; // Verifica se a data é válida e não está no passado
    }

    // Função para exibir mensagens de erro
    function showError(input, message) {
        input.classList.add('input-error');
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    // Função para limpar mensagens de erro
    function clearError(input) {
        input.classList.remove('input-error');
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
    }

    // Event listener para o botão de criar tarefa
    if (createTaskBtn) {
        createTaskBtn.addEventListener('click', async () => {
            const title = taskTitleInput.value.trim();
            const priority = taskPrioritySelect.value;
            const deadline = taskDeadlineInput.value.trim();

            // Validações
            if (!validateTaskTitle(title)) {
                showError(taskTitleInput, 'O título da tarefa não pode estar vazio.');
                return;
            } else {
                clearError(taskTitleInput);
            }

            if (!validateTaskDeadline(deadline)) {
                showError(taskDeadlineInput, 'O prazo deve ser uma data válida no formato YYYY-MM-DD.');
                return;
            } else {
                clearError(taskDeadlineInput);
            }

            // Cria a tarefa se todos os campos forem válidos
            const newCard = await createNewCard(title, priority);
            pendingColumn.appendChild(newCard);

            // Limpa os campos após a criação da tarefa
            taskTitleInput.value = '';
            taskPrioritySelect.value = 'high';
            taskDeadlineInput.value = '';
        });
    }

    // Lógica de drag and drop
    kanbanColumns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        column.addEventListener('drop', (e) => {
            e.preventDefault();
            const toColumnId = column.dataset.columnId;

            if (draggedCard) {
                const fromType = draggedCard.dataset.type;

                if (isValidConnection(fromType, toColumnId)) {
                    // Atualiza o tipo da tarefa com base na coluna de destino
                    if (toColumnId === '2') draggedCard.dataset.type = 'verificar';
                    else if (toColumnId === '3') draggedCard.dataset.type = 'aprovar';
                    else if (toColumnId === '4') draggedCard.dataset.type = 'concluido';

                    column.appendChild(draggedCard);
                } else {
                    alert('Movimento inválido! Verifique a ordem das etapas.');
                }
            }
        });
    });

    // Função para criar o gráfico e a tabela
    function showTaskFlow() {
        // Remove elementos existentes, se houver
        const existingChart = document.getElementById('task-chart');
        const existingTable = document.getElementById('task-table');
        if (existingChart) existingChart.remove();
        if (existingTable) existingTable.remove();

        // Coleta as tarefas do Kanban
        const tasks = [];
        document.querySelectorAll('.kanban-card').forEach((card) => {
            tasks.push({
                title: card.querySelector('.card-title')?.textContent || 'Sem título',
                type: card.dataset.type || 'Sem etapa',
            });
        });

        if (tasks.length === 0) {
            alert('Nenhuma tarefa encontrada para exibir.');
            return;
        }

        // Cria o gráfico
        const chartContainer = document.createElement('div');
        chartContainer.style.width = '80%';
        chartContainer.style.margin = '20px auto';
        const canvas = document.createElement('canvas');
        canvas.id = 'task-chart';
        chartContainer.appendChild(canvas);
        document.body.appendChild(chartContainer);

        const taskCounts = tasks.reduce((acc, task) => {
            acc[task.type] = (acc[task.type] || 0) + 1;
            return acc;
        }, {});

        const chartData = {
            labels: Object.keys(taskCounts),
            datasets: [{
                label: 'Tarefas por Etapa',
                data: Object.values(taskCounts),
                backgroundColor: ['#4caf50', '#ff9800', '#2196f3', '#f44336', '#9c27b0'],
            }],
        };

        new Chart(canvas, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                    },
                },
            },
        });

        // Cria a tabela
        const table = document.createElement('table');
        table.id = 'task-table';
        table.style.width = '80%';
        table.style.margin = '20px auto';
        table.style.borderCollapse = 'collapse';
        table.style.boxShadow = '0px 4px 10px rgba(0, 0, 0, 0.1)';
        table.innerHTML = `
            <thead>
                <tr>
                    <th style="padding: 10px; border: 1px solid #ddd; background-color: #4caf50; color: white;">Título</th>
                    <th style="padding: 10px; border: 1px solid #ddd; background-color: #4caf50; color: white;">Etapa</th>
                </tr>
            </thead>
            <tbody>
                ${tasks.map(task => `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${task.title}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${task.type}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        document.body.appendChild(table);
    }

    // Adiciona o botão para exibir o fluxo de tarefas
    const taskFlowBtn = document.createElement('button');
    taskFlowBtn.textContent = 'Exibir Fluxo de Tarefas';
    taskFlowBtn.classList.add('task-flow-btn');
    document.body.appendChild(taskFlowBtn);

    // Evento para exibir o gráfico e a tabela ao clicar no botão
    taskFlowBtn.addEventListener('click', showTaskFlow);
});

