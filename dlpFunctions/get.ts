export const get = async (event, context) => {
 
  console.log(event);
  console.log(context);

  const res = {
    statusCode: 200,
    body: JSON.stringify({ 
      success: true,
      data: {
        message: "OK",
      }
    })
  }

  return res
}