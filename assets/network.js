
// Block 3-V：互動式網絡圖功能

(() => {

  const data = JSON.parse(
    document.getElementById('network-data').textContent
  );

  const metricSelect = document.getElementById('metric-select');
  const metricTitle = document.getElementById('metric-title');
  const infoBox = document.getElementById('selected-info');
  const resetButton = document.getElementById('reset-network');

  // 三種中心性指標

  const names = {
    degree: 'Degree Centrality',
    betweenness: 'Betweenness Centrality',
    eigenvector: 'Eigenvector Centrality'
  };

  // 保留原始節點及邊資料

  const originalNodes = data.nodes;
  const originalEdges = data.edges;

  const rawValues = (metric) =>
    originalNodes.map(node => Number(node[metric]) || 0);


  // 依照目前指標的最小值與最大值，
  // 將節點大小縮放到 14～48。

  function nodeSize(node, metric) {

    const values = rawValues(metric);

    const low = Math.min(...values);
    const high = Math.max(...values);

    const value = Number(node[metric]) || 0;

    const normalized = high === low
      ? 0.5
      : (value - low) / (high - low);

    return 14 + normalized * 34;
  }


  // 建立節點資料

  const nodes = new vis.DataSet(
    originalNodes.map(node => ({

      ...node,

      size: nodeSize(node, 'degree'),

      title:
        `${node.label}\n` +
        `Degree: ${Number(node.degree).toFixed(3)}\n` +
        `Betweenness: ${Number(node.betweenness).toFixed(3)}\n` +
        `Eigenvector: ${Number(node.eigenvector).toFixed(3)}`

    }))
  );


  // 建立邊資料，使用固定 ID 方便隱藏及恢復

  const edges = new vis.DataSet(
    originalEdges.map((edge, index) => ({
      ...edge,
      id: index
    }))
  );


  // 建立網絡圖

  const network = new vis.Network(

    document.getElementById('network'),

    {
      nodes: nodes,
      edges: edges
    },

    {

      autoResize: true,

      physics: false,

      interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true,
        hover: true
      },

      nodes: {

        shape: 'dot',

        borderWidth: 1.5,

        color: {
          background: '#4d91c5',
          border: '#27658f',

          highlight: {
            background: '#dd9858',
            border: '#af6826'
          }
        },

        font: {
          size: 15,
          color: '#f1f5f9'
        }

      },

      edges: {

        color: {
          color: '#718394',
          highlight: '#dd9858'
        },

        width: 1.4,

        smooth: false

      }

    }

  );


  // 顯示被選取節點的中心性分數

  function displaySelection(nodeId) {

    const node = originalNodes.find(
      n => n.id === nodeId
    );

    if (!node) {

      infoBox.textContent =
        '點選節點可以查看其分數。';

      return;
    }

    const metric = metricSelect.value;

    infoBox.textContent =
      `${node.label}｜${names[metric]}：` +
      `${Number(node[metric]).toFixed(3)}`;

  }


  // ==========================================
  // 點擊 Node：只顯示該 Node 及直接鄰近節點
  // ==========================================

  function showNodeAndNeighbors(nodeId) {

    // 從原始邊資料尋找鄰近節點。
    // 不受先前隱藏節點的影響。

    const neighbors = originalEdges

      .filter(edge =>
        edge.from === nodeId ||
        edge.to === nodeId
      )

      .map(edge =>
        edge.from === nodeId
          ? edge.to
          : edge.from
      );


    // 點擊的節點 + 所有直接鄰居

    const visibleIds = new Set([
      nodeId,
      ...neighbors
    ]);


    // 隱藏不相關的節點

    nodes.update(

      originalNodes.map(node => ({

        id: node.id,

        hidden: !visibleIds.has(node.id)

      }))

    );


    // 只保留兩端都在顯示範圍內的連線

    edges.update(

      originalEdges.map((edge, index) => ({

        id: index,

        hidden: !(
          visibleIds.has(edge.from) &&
          visibleIds.has(edge.to)
        )

      }))

    );

  }


  // ==========================================
  // 恢復完整網絡
  // ==========================================

  function showAllNodes() {

    // 恢復所有節點

    nodes.update(

      originalNodes.map(node => ({

        id: node.id,

        hidden: false

      }))

    );


    // 恢復所有連線

    edges.update(

      originalEdges.map((edge, index) => ({

        id: index,

        hidden: false

      }))

    );


    // 取消節點選取

    network.unselectAll();

    infoBox.textContent = '已顯示全部節點。';

  }


  // ==========================================
  // 切換中心性指標
  // ==========================================

  metricSelect.addEventListener('change', () => {

    const metric = metricSelect.value;

    metricTitle.textContent = names[metric];


    // 只更新節點大小，不重新建立 Network。
    // 保留原本節點位置及目前的篩選狀態。

    nodes.update(

      originalNodes.map(node => ({

        id: node.id,

        size: nodeSize(node, metric)

      }))

    );


    // 更新目前選取節點的分數

    const selected = network.getSelectedNodes();

    if (selected.length) {

      displaySelection(selected[0]);

    }

  });


  // ==========================================
  // Node 點擊事件
  // ==========================================

  network.on('selectNode', params => {

    const nodeId = params.nodes[0];

    displaySelection(nodeId);

    showNodeAndNeighbors(nodeId);

  });


  // 取消選取時更新資訊

  network.on('deselectNode', () => {

    infoBox.textContent =
      '點選節點可以查看其分數。';

  });


  // 顯示全部節點按鈕

  resetButton.addEventListener(
    'click',
    showAllNodes
  );


})();
