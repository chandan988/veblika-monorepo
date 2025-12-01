"use server";

const CallbackPage = ({ searchParams }: { searchParams: { [key: string]: string | undefined } }) => {
  if (Object.keys(searchParams).length === 0) {
    return <div>No search parameters found</div>;
  }

  const searchParamsJson = JSON.stringify(searchParams);

  return (
    <div>
      <script
        dangerouslySetInnerHTML={{
          __html: `if(window.opener){window.opener.postMessage(${searchParamsJson},'*')}`,
        }}
      />
      <html>Redirect successfully, this window should close now</html>
    </div>
  );
};

export default CallbackPage;
