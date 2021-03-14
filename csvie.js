document.addEventListener("DOMContentLoaded", function () {
  var file = document.getElementById('file');
  var result = document.getElementById('result');
  var formInnerDiv = document.getElementById('formInnerDiv');
  var submitButton = document.getElementById("submit");
  var exportButton = document.getElementById("exportButton");
  var arrData = {};
  var selectedRow = null;

  // タブに対してクリックイベントを適用
  const tabs = document.getElementsByClassName('tab');
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', tabSwitch);
  }

  // File APIに対応していればfile読込時イベントを設定
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    file.addEventListener('change', loadLocalCsv, false);
  } else {
    file.style.display = 'none';
    result.innerHTML = 'File APIに対応したブラウザでご確認ください';
  }

  // submitボタンクリック時イベントを設定
  submitButton.addEventListener('click', (e) => {
    e.preventDefault();
    onFormSubmit();
  });

  // csv出力ボタンクリック時イベントを設定
  exportButton.addEventListener('click', (e) => {
    e.preventDefault();
    handleDownload();
  });



  // ************** 関数 ****************************

  // fileの読み込みが行われた時に実行する関数
  function loadLocalCsv(event) {
    // ファイル情報を取得
    var fileData = event.target.files[0];

    // CSVファイル以外は処理を止める
    if (!fileData.name.match('.csv$')) {
      alert('CSVファイルを選択してください');
      return;
    }

    // FileReaderオブジェクトを使ってファイル読み込み
    var reader = new FileReader();

    // ファイル読み込みに成功したときの処理
    reader.onload = function () {
      // file(csv)を2次元配列に変換
      arrData = csvToArray(reader.result, ",");
      // 最後の改行分の要素を削除
      if (arrData[arrData.length - 1].length == 1) {
        arrData.pop()
      }
      // console.log(arrData); // ※確認用
      // 一覧&フォームを作成
      result.appendChild(createTable(arrData));
      formInnerDiv.appendChild(createForm(arrData[0], null));
    }
    // ファイル読み込みを実行
    reader.readAsText(fileData, 'Shift_JIS');
  }

  // Submitボタンをクリックした時に実行する関数 
  function onFormSubmit() {
    var formData = readFormData(arrData);
    if (selectedRow == null) {
      insertNewRecord(formData, arrData);
    } else {
      updateRecored(formData, arrData);
    }
    resetForm(arrData);

    // クリックして一覧を表示
    var tabform = document.getElementById("tab-list");
    tabform.click();

  }

  // フォームのデータを1次配列にして返す関数
  function readFormData(arrData) {
    var formData = {};
    for (var i = 0; i < arrData[0].length; i++) {
      formData[arrData[0][i]] = document.getElementById(arrData[0][i]).value;
    }
    return formData;
  }

  // フォームデータをarrDataに追加し、一覧を再描画
  function insertNewRecord(data, arrData) {
    var insertData = [];
    for (var i = 0; i < arrData[0].length; i++) {
      insertData.push(data[arrData[0][i]]);
    }
    arrData.push(insertData);
    // console.log(insertData); // ※確認用

    // arrDataから一覧を再描画
    while (result.firstChild) {
      result.removeChild(result.firstChild);
    }
    result.appendChild(createTable(arrData));
  }

  // フォームの中身を空にする
  function resetForm(arrData) {
    for (var i = 0; i < arrData[0].length; i++) {
      document.getElementById(arrData[0][i]).value = "";
    }
    selectedRow = null;
  }

  // 一覧のEditをクリックしたときの動作
  function onEdit(event) {
    selectedRow = event.path[2].dataset.rownum;

    // formを削除して再描画
    while (formInnerDiv.firstChild) {
      formInnerDiv.removeChild(formInnerDiv.firstChild);
    }
    formInnerDiv.appendChild(createForm(arrData[0], arrData[selectedRow]));

    // クリックしてフォームを表示
    var tabform = document.getElementById("tab-form");
    tabform.click();

    // テキストエリアの高さを設定
    for (var i = 0; i < arrData[0].length; i++) {
      var textarea = document.getElementById(arrData[0][i]);
      if (textarea != null) {
        textarea.style.height = "10px";
        var wSclollHeight = parseInt(textarea.scrollHeight);
        textarea.style.height = wSclollHeight + "px";
      }
    }

  }

  // 一覧のDelをクリックしたときの動作
  function onDelete(event) {
    if (confirm("データを削除しますか？")) {
      selectedRow = event.path[2].dataset.rownum;
      arrData.splice(selectedRow, 1);

      // arrDataから一覧を再描画
      while (result.firstChild) {
        result.removeChild(result.firstChild);
      }
      result.appendChild(createTable(arrData));

      selectedRow = null;
    }
  }

  // フォームからアップデートするときの関数
  function updateRecored(data, arrData) {
    // selectedRowを用いてarrDataの中身をUpdate
    arrData[selectedRow] = [];
    for (var i = 0; i < arrData[0].length; i++) {
      arrData[selectedRow][i] = data[arrData[0][i]];
    }

    // arrDataから一覧を再描画
    while (result.firstChild) {
      result.removeChild(result.firstChild);
    }
    result.appendChild(createTable(arrData));

    selectedRow = null;
  }

  // csvでarrDataをダウンロードするときの関数
  function handleDownload() {
    var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);//文字コードをBOM付きUTF-8に指定
    var data_csv = arrayToCsv(arrData)

    var blob = new Blob([bom, data_csv], { "type": "text/csv" });
    if (window.navigator.msSaveBlob) { //IEの場合の処理
      window.navigator.msSaveBlob(blob, "test.csv");
      //window.navigator.msSaveOrOpenBlob(blob, "test.csv");// msSaveOrOpenBlobの場合はファイルを保存せずに開ける
    } else {
      var link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = 'samplecsv.csv'
      link.click()
    }

    delete data_csv;
  }

  // タブをクリックすると実行する関数
  function tabSwitch() {
    // タブのclassの値を変更
    document.getElementsByClassName('is-active')[0].classList.remove('is-active');
    this.classList.add('is-active');
    // コンテンツのclassの値を変更
    document.getElementsByClassName('is-show')[0].classList.remove('is-show');
    const arrayTabs = Array.prototype.slice.call(tabs);
    const index = arrayTabs.indexOf(this);
    document.getElementsByClassName('panel')[index].classList.add('is-show');
  };

  // csvデータを2次元データに変換する関数
  function csvToArray(strData, strDelimiter) {
    strDelimiter = (strDelimiter || ",");

    var objPattern = new RegExp(
      (
        // Delimiters.
        "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
        // Quoted fields.
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
        // Standard fields.
        "([^\"\\" + strDelimiter + "\\r\\n]*))"
      ),
      "gi"
    );

    var arrData = [[]];
    var arrMatches = null;

    // Keep looping over the regular expression matches until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {

      // Get the delimiter that was found.
      var strMatchedDelimiter = arrMatches[1];

      // Check to see if the given delimiter has a length
      // (is not the start of string) and if it matches field delimiter. 
      // If id does not, then we know that this delimiter is a row delimiter.
      if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {
        // Since we have reached a new row of data, add an empty row to our data array.
        arrData.push([]);
      }

      var strMatchedValue;
      // Now that we have our delimiter out of the way,
      // let's check to see which kind of value we captured (quoted or unquoted).
      if (arrMatches[2]) {
        // We found a quoted value. When we capture this value, unescape any double quotes.
        strMatchedValue = arrMatches[2].replace(
          new RegExp("\"\"", "g"), "\"");

      } else {
        // We found a non-quoted value.
        strMatchedValue = arrMatches[3];
      }

      // Now that we have our value string, let's add it to the data array.
      arrData[arrData.length - 1].push(strMatchedValue);
    }

    return arrData;
  }

  // 2次元データをcsv文字列に変換する関数
  function arrayToCsv(table, replacer) {
    replacer = replacer || function (r, c, v) { return v; };
    var csv = '', c, cc, r, rr = table.length, cell;
    for (r = 0; r < rr; ++r) {
      if (r) { csv += '\r\n'; }
      for (c = 0, cc = table[r].length; c < cc; ++c) {
        if (c) { csv += ','; }
        cell = replacer(r, c, table[r][c]);
        if (/[,\r\n"]/.test(cell)) { cell = '"' + cell.replace(/"/g, '""') + '"'; }
        csv += (cell || 0 === cell) ? cell : '';
      }
    }
    return csv;
  }

  // 2次元データをtableに変換する関数
  function createTable(data) {
    var table = document.createElement('table');
    table.setAttribute("id", "loadedList");

    for (var i = 0; i < data.length; i++) {
      var tr = document.createElement('tr');
      tr.setAttribute("data-rownum", i)

      // 最後の2データは一覧に表示しない
      for (var j = 0; j < (data[i].length - 1); j++) {
        var td = document.createElement('td');
        // 最後の列はフォーム画面へのリンク
        if (j == (data[i].length - 2)) {
          var aEdit = document.createElement('a')
          aEdit.innerText = "Edit";
          // ヘッダにイベントを設定しない
          if (i != 0) {
            aEdit.addEventListener("click", onEdit, false);
          }
          var aDel = document.createElement('a')
          aDel.innerText = "Del";
          if (i != 0) {
            aDel.addEventListener("click", onDelete, false);
          }
          td.appendChild(aEdit);
          td.appendChild(aDel);
          tr.appendChild(td);
        } else {
          td.innerText = data[i][j];
          tr.appendChild(td);
        }
      }

      if (i == 0) {
        var thead = document.createElement("thead");
        table.appendChild(thead);
        thead.appendChild(tr);
        var tbody = document.createElement("tbody")
        table.appendChild(tbody);
      } else {
        tbody.appendChild(tr);
      }
    }
    return table;
  }

  // ヘッダ情報・選択列情報から入力フォームを作成する関数
  function createForm(headData, selectedData) {
    var formDiv = document.createElement("div");
    formDiv.setAttribute("class", "input-forms");
    formDiv.setAttribute("id", "input-forms");
    var table = document.createElement("table");
    formDiv.appendChild(table);

    for (var i = 0; i < headData.length; i++) {
      var tr = document.createElement('tr');
      tr.setAttribute("class", "input-form")
      var th = document.createElement('th');
      th.setAttribute("class", "lavel")
      th.innerText = headData[i] + ": "
      tr.appendChild(th);

      var text_reg = new RegExp(/(id|subject|hostname|status)/);
      var time_reg = new RegExp(/(create_time|close_time)/);
      if (text_reg.test(headData[i])) {
        var td = document.createElement("td");
        var inputText = document.createElement('input');
        inputText.setAttribute("type", "text");
        inputText.setAttribute("id", headData[i]);
        if (selectedData != null) {
          inputText.value = selectedData[i];
        }
        td.appendChild(inputText);
        tr.appendChild(td);
      } else if (time_reg.test(headData[i])) {
        var td = document.createElement("td");
        var inputText = document.createElement('input');
        inputText.setAttribute("type", "date");
        inputText.setAttribute("id", headData[i]);
        if (selectedData != null) {
          inputText.value = selectedData[i];
        }
        td.appendChild(inputText);
        tr.appendChild(td);
      } else {
        var td = document.createElement("td");
        var inputText = document.createElement('textarea');
        inputText.setAttribute("name", headData[i]);
        inputText.setAttribute("id", headData[i]);
        inputText.setAttribute("class", "textArea");
        inputText.addEventListener("change", textAreaHeightSet, false);
        inputText.addEventListener("input", textAreaHeightSet, false);
        if (selectedData != null) {
          inputText.value = selectedData[i];
        }
        td.appendChild(inputText);
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    return formDiv;
  }

  // テキストエリアの自動拡張
  function textAreaHeightSet(event) {
    targetObject = document.getElementById(event.target.id);

    if (targetObject != null) {
      targetObject.style.height = "10px";
      var wSclollHeight = parseInt(targetObject.scrollHeight);
      // テキストエリアの高さを設定する
      targetObject.style.height = wSclollHeight + "px";
    }
  }

})
