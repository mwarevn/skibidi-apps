package com.mwarevn.skibiops.react.services;


import android.content.ComponentName;
import android.content.Context;
import android.os.RemoteException;
import com.mwarevn.skibiops.IAppManagerService;
import java.io.IOException;

public class AppManagerUserService extends IAppManagerService.Stub {


    private Context context;

    public ComponentName getName() {
        ComponentName cpn = new ComponentName(context, AppManagerUserService.class);
        return cpn;
    }

    public AppManagerUserService(Context context) {
        this.context = context;
    }

    @Override
    public void uninstallPackage(String packageName) throws RemoteException {

    }

    @Override
    public void disablePackage(String packageName) throws RemoteException {
        try {
            Process process = Runtime.getRuntime().exec(new String[]{"sh", "-c", "pm disable-user --user 0 " + packageName});
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new RemoteException("Không thể vô hiệu hóa gói: mã thoát " + exitCode);
            }
        } catch (IOException | InterruptedException e) {
            throw new RemoteException("Lỗi khi thực thi lệnh shell: " + e.getMessage());
        }
    }

    @Override
    public void enablePackage(String packageName) throws RemoteException {

    }

    @Override
    public void forceStopPackage(String packageName) throws RemoteException {

    }

    @Override
    public void destroy() throws RemoteException {

    }


}
