  $('#tagline-step-0').css({'color':'#217269'});
  $('#tagline-step-1').css({'color':'#217269'});
  $('#tagline-step-2').css({'color':'#217269'});
  $('#tagline-step-3').css({'color':'#217269'});
  $('#tagline-step-4').css({'color':'#217269'});
  $('#tagline-step-5').css({'color':'#217269'});

function reAnimateDonut(){
  changeAndMorph(animatedData[donutIndex].donutData);
  animateExplanationText();
  animateTagIcon();
  animateTagLineText;
  animateMobileTagLineText();
}
function changeDonut(id) {
  $('#tagline-step-0').css({'color':'#217269'});
  $('#tagline-step-1').css({'color':'#217269'});
  $('#tagline-step-2').css({'color':'#217269'});
  $('#tagline-step-3').css({'color':'#217269'});
  $('#tagline-step-4').css({'color':'#217269'});
  $('#tagline-step-5').css({'color':'#217269'});
  $('#explanation-step-0').fadeOut(200, function () {
  });

  $('#explanation-step-1').fadeOut(200, function () {
  });

  $('#explanation-step-2').fadeOut(200, function () {
  });

  $('#explanation-step-3').fadeOut(200, function () {
  });

  $('#explanation-step-4').fadeOut(200, function () {
  });

  $('#explanation-step-5').fadeOut(200, function () {
  });


  if (id == 'tagline-step-0') {
    donutIndex = 0;
    reAnimateDonut();
    $('#tagline-step-0').css({'color':'#3ebeb0'});
  } else if (id == 'tagline-step-1') {
    donutIndex = 1;
    reAnimateDonut();
    $('#tagline-step-1').css({'color':'#3ebeb0'});
  } else if (id == 'tagline-step-2') {
    donutIndex = 2;
    reAnimateDonut();
    $('#tagline-step-2').css({'color':'#3ebeb0'});
  } else if (id == 'tagline-step-3') {
    donutIndex = 3;
    reAnimateDonut();
    $('#tagline-step-3').css({'color':'#3ebeb0'});
  } else if (id == 'tagline-step-4') {
    donutIndex = 4;
    reAnimateDonut();
    $('#tagline-step-4').css({'color':'#3ebeb0'});
  } else if (id == 'tagline-step-5') {
    donutIndex = 5;
    reAnimateDonut();
    $('#tagline-step-5').css({'color':'#3ebeb0'});
  }
}