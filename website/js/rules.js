/* 純函式：相同答案得到相同摘要與建議；無診斷、分數或產品適配推論。 */
window.PPA_RULES = {
  validate(q, answer) {
    const values = answer?.values || [];
    if (q.required && !values.length) return '請選擇一個符合你的答案，再繼續。';
    if (values.some(v => !q.options.includes(v))) return '答案選項已更新，請重新選擇。';
    if (q.type === 'single' && values.length > 1) return '此題為單選，請選擇一項。';
    if (q.max && values.length > q.max) return `此題最多選 ${q.max} 項，請調整選擇。`;
    if (values.some(v => q.exclusive.includes(v)) && values.length > 1) return '此選項須單獨選取。';
    if (values.includes('其他') && !(answer.other || '').trim()) return '你選擇了「其他」，請簡短補充內容。';
    if (values.includes('其他') && answer.other.length > 100) return '補充內容請控制在 100 字以內。';
    return '';
  },
  toggle(q, values, value, checked) {
    if (q.type === 'single') return [value];
    if (!checked) return values.filter(v => v !== value);
    if (q.exclusive.includes(value)) return [value];
    return [...new Set([...values.filter(v => !q.exclusive.includes(v)), value])];
  },
  result(answers) {
    const values = id => answers[id]?.values || [];
    const has = (id, text) => values(id).includes(text);
    const summary = [];
    const labels = {A03:'日常環境', A04:'目前使用部位', A06:'使用頻率', A07:'使用時間', B01:'關注部位', B02:'選購考量', B03:'安排偏好', B04:'想先了解', A09:'冷氣環境時間', A13:'沐浴後的習慣', B06:'使用感偏好', B13:'資訊形式', A22:'平假日安排', A30:'接觸水的情境', B15:'安排時間偏好', B21:'在家容量偏好', D02:'購買前想確認', D12:'購物資訊需求'};
    for (const [id, label] of Object.entries(labels)) {
      if (!values(id).length) continue;
      let selected = values(id);
      // 使用頻率與部位有不同回答時保留原文，但不將時間描述成既有固定習慣。
      if (id === 'A07' && has('A06', '目前沒有使用')) continue;
      summary.push({label, text: selected.map(v => v === '其他' ? `其他：${answers[id].other || '未補充'}` : v).join('、')});
    }
    const plan = [];
    const add = (title, text, basis) => plan.push({title, text, basis});
    const noNeed = has('B01', '目前沒有特別需求') || has('B14', '目前不打算改變');
    if (noNeed) {
      add('保留自己的節奏', '你目前沒有額外的保養需求或改變計畫，可以先保留這份整理，有需要時再查看產品資訊。', '依據：關注需求／改變意願');
    } else {
      if (has('B03', '需要時再使用')) add('留一個需要時的選擇', '依你偏好的「需要時再使用」，可先備妥產品說明，當有保濕需求時再依標示安排，不必增加固定步驟。', '依據：B03 安排偏好');
      else if (has('B03', '步驟簡單') || has('A08', '步驟太多') || has('B14', '先減少步驟')) add('從一個部位開始', '如果想調整習慣，可以先選一個關注的部位、保留簡單步驟，使用方式與用量依所選產品標示。', '依據：A08／B03／B14');
      else if (has('B03', '固定早晚保養')) add('整理早晚的小安排', '你偏好固定早晚安排，可把適合的產品說明放在手邊，再依標示與自己的需要安排；這不是 PPA 的使用頻率建議。', '依據：B03 安排偏好');
      else if (values('A07').some(v=>['早上','洗臉或沐浴後','洗手後','睡前'].includes(v)) && !has('A06','目前沒有使用')) add('沿用熟悉的時間', `你提到的時間是「${values('A07').filter(v=>v!=='其他').join('、')}」。可以先回顧這些時段是否方便，保留符合需求的安排。`, '依據：A07 使用時間');
      else add('先了解，再決定安排', '可以先查看產品用途與使用標示，再決定是否要建立保濕習慣，不需要一次做很多改變。', '依據有限：尚無明確的時間或步驟偏好');
      if (has('A08','容易忘記') && !has('B16','不需要提醒')) add('讓用品更容易想起', '若你想建立習慣，可把用品放在容易想起且符合保存標示的位置。提醒時間可由自己決定。', '依據：A08 容易忘記');
    }
    if (has('A08','不喜歡黏膩感')) add('先確認質地與使用感', '把質地示範與使用感列為挑選重點，再決定是否嘗試；目前資料不足以判定 PPA 的質地是否符合你的偏好。', '依據：A08 不喜歡黏膩感');
    if (plan.length < 3) add('選購前留一份清單', values('B02').length ? `你在意「${values('B02').filter(v=>v!=='其他').join('、') || '自行補充的考量'}」，可先比較這些資訊；實際用途與使用方式仍以產品正式標示為準。` : '現有回答不足以整理選購偏好，可先查看用途、完整標示與使用說明，再自行決定。', values('B02').length ? '依據：B02 選購考量' : '依據有限：一般性安排');
    return {summary, plan:plan.slice(0,3), context: has('A01','家人') || has('A01','自己與家人') ? '以下依本次填答整理，包含你替家人了解的情境；不推定家人的年齡或使用狀況。' : '以下只整理你實際提供的回答，不判定膚質，也不代表產品適合度。', next: values('D03')[0] || '可以先保留這份結果，再依需要了解更多。'};
  }
};
