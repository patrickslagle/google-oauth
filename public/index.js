console.log("hello, world!");

axios.get('/api/current_user').then(res => {
  console.log('success');
  console.log(res.data);
});